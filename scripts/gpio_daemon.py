#!/usr/bin/env python3
"""
GPIO Daemon for Winston Slots Arcade Button
Handles:
- Button press detection on GPIO17
- LED control on GPIO23
- WebSocket communication with Rails backend
- LED pulsing when game is in 'ready' state
"""

import sys
import time
import json
import threading
import logging
from typing import Optional

try:
    import RPi.GPIO as GPIO
except ImportError:
    print("RPi.GPIO not available. Install with: pip3 install RPi.GPIO")
    sys.exit(1)

try:
    import websocket
except ImportError:
    print("websocket-client not available. Install with: pip3 install websocket-client")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("requests not available. Install with: pip3 install requests")
    sys.exit(1)

# Configuration
BUTTON_PIN = 17  # GPIO17 for button switch
LED_PIN = 23     # GPIO23 for button LED
BACKEND_URL = "http://localhost:3000"
WS_URL = "ws://localhost:3000/cable"

# LED States
LED_OFF = 0
LED_ON = 1
LED_PULSING = 2

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ArcadeButtonController:
    """Controls arcade button LED and handles button presses"""

    def __init__(self):
        self.current_state = "idle"  # idle, ready, spinning, results
        self.current_player_id = None
        self.led_state = LED_OFF
        self.led_thread = None
        self.stop_led_thread = False
        self.ws = None
        self.ws_connected = False

        # Setup GPIO
        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)

        # Setup button (input with pull-up resistor)
        GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

        # Setup LED (output)
        GPIO.setup(LED_PIN, GPIO.OUT)
        GPIO.output(LED_PIN, GPIO.LOW)

        # Add button press detection with debounce
        GPIO.add_event_detect(
            BUTTON_PIN,
            GPIO.FALLING,
            callback=self.button_pressed,
            bouncetime=300
        )

        logger.info("GPIO initialized - Button: GPIO%d, LED: GPIO%d", BUTTON_PIN, LED_PIN)

    def button_pressed(self, channel):
        """Callback when button is pressed"""
        logger.info("Button pressed! Current state: %s", self.current_state)

        # Only allow spin when in 'ready' state
        if self.current_state != "ready":
            logger.warning("Button press ignored - not in ready state")
            return

        if not self.current_player_id:
            logger.warning("Button press ignored - no player registered")
            return

        # Stop LED pulsing
        self.set_led_state(LED_ON)

        # Trigger spin
        self.trigger_spin()

    def trigger_spin(self):
        """Trigger a spin via the Rails API"""
        try:
            logger.info("Triggering spin for player %s", self.current_player_id)

            # Create spin
            response = requests.post(
                f"{BACKEND_URL}/api/spins",
                json={"player_id": self.current_player_id},
                headers={"Content-Type": "application/json"},
                timeout=5
            )

            if response.status_code == 201:
                spin_data = response.json()
                spin_id = spin_data["id"]
                logger.info("Spin created: %s", spin_id)

                # Update game state to spinning
                requests.post(
                    f"{BACKEND_URL}/api/game_state",
                    json={
                        "state": "spinning",
                        "player_id": self.current_player_id,
                        "spin_id": spin_id
                    },
                    headers={"Content-Type": "application/json"},
                    timeout=5
                )

                logger.info("Game state updated to spinning")
            else:
                logger.error("Failed to create spin: %s", response.text)

        except Exception as e:
            logger.error("Error triggering spin: %s", e)

    def set_led_state(self, state):
        """Set LED state (OFF, ON, or PULSING)"""
        # Stop any existing LED thread
        if self.led_thread and self.led_thread.is_alive():
            self.stop_led_thread = True
            self.led_thread.join(timeout=2)

        self.led_state = state
        self.stop_led_thread = False

        if state == LED_OFF:
            GPIO.output(LED_PIN, GPIO.LOW)
            logger.info("LED: OFF")

        elif state == LED_ON:
            GPIO.output(LED_PIN, GPIO.HIGH)
            logger.info("LED: ON")

        elif state == LED_PULSING:
            # Start pulsing thread
            self.led_thread = threading.Thread(target=self._pulse_led, daemon=True)
            self.led_thread.start()
            logger.info("LED: PULSING")

    def _pulse_led(self):
        """Pulse LED using PWM"""
        pwm = GPIO.PWM(LED_PIN, 100)  # 100 Hz frequency
        pwm.start(0)

        try:
            while not self.stop_led_thread:
                # Fade in
                for duty_cycle in range(0, 101, 5):
                    if self.stop_led_thread:
                        break
                    pwm.ChangeDutyCycle(duty_cycle)
                    time.sleep(0.02)

                # Fade out
                for duty_cycle in range(100, -1, -5):
                    if self.stop_led_thread:
                        break
                    pwm.ChangeDutyCycle(duty_cycle)
                    time.sleep(0.02)
        finally:
            pwm.stop()

    def handle_state_change(self, event_data):
        """Handle game state changes from WebSocket"""
        state = event_data.get("state")
        player_id = event_data.get("player_id")

        logger.info("State changed: %s (player: %s)", state, player_id)

        self.current_state = state
        self.current_player_id = player_id

        # Update LED based on state
        if state == "idle":
            self.set_led_state(LED_OFF)
            self.current_player_id = None

        elif state == "ready":
            # Pulsate LED to indicate ready to spin
            self.set_led_state(LED_PULSING)

        elif state == "spinning":
            # Solid LED during spin
            self.set_led_state(LED_ON)

        elif state == "results":
            # Keep LED on during results
            self.set_led_state(LED_ON)

    def on_ws_message(self, ws, message):
        """Handle WebSocket messages"""
        try:
            data = json.loads(message)

            # Handle different message types
            if data.get("type") == "ping":
                return

            if data.get("type") == "welcome":
                logger.info("WebSocket welcomed")
                # Subscribe to game channel
                ws.send(json.dumps({
                    "command": "subscribe",
                    "identifier": json.dumps({"channel": "GameChannel"})
                }))
                return

            if data.get("type") == "confirm_subscription":
                logger.info("Subscribed to GameChannel")
                self.ws_connected = True
                return

            # Handle game state changes
            if data.get("message"):
                message_data = data["message"]
                event = message_data.get("event")

                if event == "state_changed":
                    self.handle_state_change(message_data)

        except json.JSONDecodeError as e:
            logger.error("Failed to parse WebSocket message: %s", e)
        except Exception as e:
            logger.error("Error handling WebSocket message: %s", e)

    def on_ws_error(self, ws, error):
        """Handle WebSocket errors"""
        logger.error("WebSocket error: %s", error)
        self.ws_connected = False

    def on_ws_close(self, ws, close_status_code, close_msg):
        """Handle WebSocket close"""
        logger.warning("WebSocket closed: %s - %s", close_status_code, close_msg)
        self.ws_connected = False

        # Attempt reconnect after delay
        time.sleep(5)
        self.connect_websocket()

    def on_ws_open(self, ws):
        """Handle WebSocket open"""
        logger.info("WebSocket connected")

    def connect_websocket(self):
        """Connect to Rails WebSocket"""
        try:
            logger.info("Connecting to WebSocket: %s", WS_URL)

            self.ws = websocket.WebSocketApp(
                WS_URL,
                on_open=self.on_ws_open,
                on_message=self.on_ws_message,
                on_error=self.on_ws_error,
                on_close=self.on_ws_close
            )

            # Run WebSocket in separate thread
            ws_thread = threading.Thread(target=self.ws.run_forever, daemon=True)
            ws_thread.start()

        except Exception as e:
            logger.error("Failed to connect to WebSocket: %s", e)

    def run(self):
        """Main run loop"""
        logger.info("Starting GPIO daemon...")

        # Connect to WebSocket
        self.connect_websocket()

        # Keep running
        try:
            while True:
                time.sleep(1)

                # Check WebSocket connection
                if not self.ws_connected:
                    logger.warning("WebSocket disconnected, reconnecting...")
                    self.connect_websocket()
                    time.sleep(5)

        except KeyboardInterrupt:
            logger.info("Shutting down...")
        finally:
            self.cleanup()

    def cleanup(self):
        """Clean up GPIO and resources"""
        logger.info("Cleaning up...")
        self.stop_led_thread = True

        if self.ws:
            self.ws.close()

        GPIO.cleanup()
        logger.info("GPIO daemon stopped")


def main():
    """Main entry point"""
    controller = ArcadeButtonController()
    controller.run()


if __name__ == "__main__":
    main()

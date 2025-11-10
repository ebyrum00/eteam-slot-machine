#!/usr/bin/env python3
"""
GPIO Daemon for Winston Slots Arcade Button (Pi 5 compatible using gpiod)
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
    import gpiod
    from gpiod.line import Direction, Value, Edge, Bias
except ImportError:
    print("libgpiod not available. Install with: sudo apt install python3-libgpiod")
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
BACKEND_URL = "http://192.168.100.247:3000"  # Connect to Mac dev server
WS_URL = "ws://192.168.100.247:3000/cable"

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
        self.running = True

        # Get GPIO chip - try different chip numbers for Pi 5 compatibility
        self.chip = None
        for chip_name in ['gpiochip4', 'gpiochip0', 'gpiochip1']:
            try:
                self.chip = gpiod.Chip(chip_name)
                logger.info("Using GPIO chip: %s", chip_name)
                break
            except Exception as e:
                logger.debug("Failed to open %s: %s", chip_name, e)
                continue

        if self.chip is None:
            raise RuntimeError("Could not find any GPIO chip")

        # Setup button line (input with pull-up)
        self.button_line = self.chip.get_line(BUTTON_PIN)
        self.button_line.request(consumer="button", type=Direction.INPUT, bias=Bias.PULL_UP, edge_detection=Edge.FALLING)

        # Setup LED line (output)
        self.led_line = self.chip.get_line(LED_PIN)
        self.led_line.request(consumer="led", type=Direction.OUTPUT, default_value=Value.INACTIVE)

        logger.info("GPIO initialized - Button: GPIO%d, LED: GPIO%d", BUTTON_PIN, LED_PIN)

        # Start button monitoring thread
        self.button_thread = threading.Thread(target=self.monitor_button, daemon=True)
        self.button_thread.start()

    def monitor_button(self):
        """Monitor button presses in a separate thread"""
        logger.info("Button monitoring thread started")
        while self.running:
            # Wait for button press event (with timeout)
            if self.button_line.wait_edge_events(timeout=0.1):
                # Read and consume the event
                events = self.button_line.read_edge_events()
                for event in events:
                    if event.event_type == Edge.FALLING:
                        self.button_pressed()
                # Debounce
                time.sleep(0.3)

    def button_pressed(self):
        """Handle button press"""
        logger.info("Button pressed! Current state: %s", self.current_state)

        # Only allow spin when in 'ready' state
        if self.current_state != "ready":
            logger.warning("Button press ignored - not in ready state")
            return

        if not self.current_player_id:
            logger.warning("Button press ignored - no player registered")
            return

        # Create spin via API
        self.create_spin()

    def create_spin(self):
        """Create a spin via the API"""
        try:
            logger.info("Creating spin for player %d", self.current_player_id)
            response = requests.post(
                f"{BACKEND_URL}/api/spins",
                json={"player_id": self.current_player_id},
                timeout=5
            )

            if response.status_code == 200 or response.status_code == 201:
                spin_data = response.json()
                logger.info("Spin created successfully: %s", spin_data)
            else:
                logger.error("Failed to create spin: %d - %s", response.status_code, response.text)

        except Exception as e:
            logger.error("Error creating spin: %s", e)

    def set_led_state(self, state):
        """Set LED state (OFF, ON, or PULSING)"""
        if state == self.led_state:
            return

        logger.info("LED state changing: %s -> %s", self.led_state, state)
        self.led_state = state

        # Stop existing LED thread
        if self.led_thread and self.led_thread.is_alive():
            self.stop_led_thread = True
            self.led_thread.join(timeout=1.0)

        # Reset flags
        self.stop_led_thread = False

        # Start new LED behavior
        if state == LED_OFF:
            self.led_line.set_value(Value.INACTIVE)
        elif state == LED_ON:
            self.led_line.set_value(Value.ACTIVE)
        elif state == LED_PULSING:
            self.led_thread = threading.Thread(target=self.pulse_led, daemon=True)
            self.led_thread.start()

    def pulse_led(self):
        """Pulse LED in a separate thread"""
        logger.info("LED pulsing started")
        while not self.stop_led_thread:
            # Fade in (pulse effect with simple on/off pattern)
            for i in range(10):
                if self.stop_led_thread:
                    break
                self.led_line.set_value(Value.ACTIVE)
                time.sleep(0.05)
                self.led_line.set_value(Value.INACTIVE)
                time.sleep(0.05)

            # Brief pause
            time.sleep(0.3)

        logger.info("LED pulsing stopped")

    def handle_state_change(self, state, player_id=None):
        """Handle game state changes"""
        logger.info("State changed: %s -> %s (player: %s)", self.current_state, state, player_id)
        self.current_state = state
        self.current_player_id = player_id

        # Update LED based on state
        if state == "idle":
            self.set_led_state(LED_OFF)
        elif state == "ready":
            self.set_led_state(LED_PULSING)
        elif state in ["spinning", "results"]:
            self.set_led_state(LED_ON)

    def cleanup(self):
        """Cleanup GPIO resources"""
        logger.info("Cleaning up GPIO...")
        self.running = False
        self.stop_led_thread = True

        if self.button_thread and self.button_thread.is_alive():
            self.button_thread.join(timeout=1.0)

        if self.led_thread and self.led_thread.is_alive():
            self.led_thread.join(timeout=1.0)

        self.button_line.release()
        self.led_line.release()
        logger.info("GPIO cleanup complete")


class WebSocketClient:
    """Manages WebSocket connection to Rails backend"""

    def __init__(self, controller):
        self.controller = controller
        self.ws = None
        self.running = True

    def on_message(self, ws, message):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(message)
            logger.debug("WS message: %s", data)

            # Handle ActionCable messages
            if data.get("type") == "ping":
                return

            if data.get("type") == "welcome":
                logger.info("WebSocket welcomed, subscribing to GameChannel...")
                subscribe_msg = {
                    "command": "subscribe",
                    "identifier": json.dumps({"channel": "GameChannel"})
                }
                ws.send(json.dumps(subscribe_msg))
                return

            if data.get("type") == "confirm_subscription":
                logger.info("Subscribed to GameChannel")
                return

            # Handle game state updates
            if data.get("message"):
                msg = data["message"]
                event = msg.get("event")

                if event == "state_changed":
                    state = msg.get("state")
                    player_id = msg.get("player_id")
                    self.controller.handle_state_change(state, player_id)

        except Exception as e:
            logger.error("Error handling message: %s", e)

    def on_error(self, ws, error):
        """Handle WebSocket errors"""
        logger.error("WebSocket error: %s", error)

    def on_close(self, ws, close_status_code, close_msg):
        """Handle WebSocket close"""
        logger.warning("WebSocket closed: %s - %s", close_status_code, close_msg)
        self.controller.ws_connected = False

    def on_open(self, ws):
        """Handle WebSocket open"""
        logger.info("WebSocket connected")
        self.controller.ws_connected = True

    def connect(self):
        """Connect to WebSocket"""
        logger.info("Connecting to WebSocket: %s", WS_URL)

        self.ws = websocket.WebSocketApp(
            WS_URL,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close,
            on_open=self.on_open
        )

        # Run in a separate thread
        ws_thread = threading.Thread(target=self.ws.run_forever, daemon=True)
        ws_thread.start()

    def disconnect(self):
        """Disconnect from WebSocket"""
        if self.ws:
            self.ws.close()


def main():
    """Main entry point"""
    logger.info("Starting Winston Slots GPIO Daemon...")

    controller = None
    ws_client = None

    try:
        controller = ArcadeButtonController()
        ws_client = WebSocketClient(controller)
        ws_client.connect()

        logger.info("Daemon running. Press Ctrl+C to exit.")

        # Keep main thread alive
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        logger.info("Shutting down...")
    except Exception as e:
        logger.error("Fatal error: %s", e)
        sys.exit(1)
    finally:
        if ws_client:
            ws_client.disconnect()
        if controller:
            controller.cleanup()
        logger.info("Daemon stopped")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Test GPIO hardware directly to verify button and LED wiring
Run this AFTER stopping the gpio-daemon service:
  sudo systemctl stop gpio-daemon
"""

import gpiod
import time
from gpiod.line import Direction, Value, Bias

BUTTON_PIN = 17
LED_PIN = 23

def test_led():
    """Test LED by turning it on for 3 seconds"""
    print("\n=== LED Test ===")
    print("Testing LED on GPIO23...")

    chip = gpiod.Chip('/dev/gpiochip4')
    line_settings = {LED_PIN: gpiod.LineSettings(direction=Direction.OUTPUT, output_value=Value.INACTIVE)}
    request = chip.request_lines(consumer="led-test", config=line_settings)

    print("LED should turn ON now for 3 seconds...")
    request.set_value(LED_PIN, Value.ACTIVE)
    time.sleep(3)

    print("LED should turn OFF now...")
    request.set_value(LED_PIN, Value.INACTIVE)

    request.release()
    print("✓ LED test complete")
    print()

def test_button():
    """Test button by reading its state"""
    print("=== Button Test ===")
    print("Testing button on GPIO17...")

    chip = gpiod.Chip('/dev/gpiochip4')
    line_settings = {BUTTON_PIN: gpiod.LineSettings(direction=Direction.INPUT, bias=Bias.PULL_UP)}
    request = chip.request_lines(consumer="button-test", config=line_settings)

    print("Reading button state for 10 seconds...")
    print("Press and release the button multiple times.")
    print("You should see the value change from 1 (not pressed) to 0 (pressed)")
    print()

    last_value = None
    start_time = time.time()

    while time.time() - start_time < 10:
        value = request.get_value(BUTTON_PIN)

        if value != last_value:
            if value == Value.INACTIVE:  # Button pressed (pulled to ground)
                print(f"  Button PRESSED (value: {int(value)})")
            else:  # Button released (pulled high)
                print(f"  Button RELEASED (value: {int(value)})")
            last_value = value

        time.sleep(0.05)

    request.release()
    print()
    print("✓ Button test complete")
    print()

def main():
    print("=" * 60)
    print("GPIO Hardware Test for Winston Slots")
    print("=" * 60)
    print()
    print("This script tests:")
    print("  - LED on GPIO23 (should light up)")
    print("  - Button on GPIO17 (should detect presses)")
    print()
    print("Make sure gpio-daemon is stopped first:")
    print("  sudo systemctl stop gpio-daemon")
    print()

    try:
        # Test LED first
        test_led()

        # Then test button
        test_button()

        print("=" * 60)
        print("Tests complete!")
        print()
        print("If LED didn't light up:")
        print("  - Check wiring: GPIO23 (Pin 16) → 220Ω resistor → LED+ → LED- → GND")
        print("  - Verify LED polarity (longer leg is positive)")
        print("  - Check resistor value (should be 220Ω - 1kΩ)")
        print()
        print("If button didn't respond:")
        print("  - Check wiring: Button terminal → GPIO17 (Pin 11)")
        print("  - Check wiring: Button terminal → GND (Pin 9)")
        print("  - Try swapping the two button wires")
        print()
        print("To restart the daemon:")
        print("  sudo systemctl start gpio-daemon")
        print("=" * 60)

    except Exception as e:
        print(f"Error: {e}")
        print()
        print("Make sure gpio-daemon is stopped:")
        print("  sudo systemctl stop gpio-daemon")

if __name__ == "__main__":
    main()

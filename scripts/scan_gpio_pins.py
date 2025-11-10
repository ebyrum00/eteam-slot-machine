#!/usr/bin/env python3
"""
Scan all GPIO pins to find which ones are connected to button and LED
Run this AFTER stopping the gpio-daemon service:
  sudo systemctl stop gpio-daemon
"""

import gpiod
import time
from gpiod.line import Direction, Value, Bias

# Common GPIO pins on Raspberry Pi (excluding special pins like I2C, SPI, etc.)
TESTABLE_PINS = [2, 3, 4, 5, 6, 12, 13, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27]

def test_output_pins():
    """Test all pins as outputs to find the LED"""
    print("\n" + "=" * 60)
    print("PART 1: LED Detection")
    print("=" * 60)
    print("\nTesting each GPIO pin as an output...")
    print("Watch your LED - it should blink when we hit the right pin!")
    print()

    chip = gpiod.Chip('/dev/gpiochip4')

    for pin in TESTABLE_PINS:
        try:
            line_settings = {pin: gpiod.LineSettings(direction=Direction.OUTPUT, output_value=Value.INACTIVE)}
            request = chip.request_lines(consumer="led-scan", config=line_settings)

            print(f"Testing GPIO{pin}...", end=' ', flush=True)

            # Blink 3 times
            for _ in range(3):
                request.set_value(pin, Value.ACTIVE)
                time.sleep(0.3)
                request.set_value(pin, Value.INACTIVE)
                time.sleep(0.3)

            request.release()
            print("✓")
            time.sleep(0.5)

        except Exception as e:
            print(f"✗ (Error: {e})")

    print("\nDid you see the LED blink? Enter the GPIO number that made it blink:")
    print("(or press Enter to skip)")

def test_input_pins():
    """Test all pins as inputs to find the button"""
    print("\n" + "=" * 60)
    print("PART 2: Button Detection")
    print("=" * 60)
    print("\nTesting each GPIO pin as an input...")
    print("Press and release your button repeatedly during the test!")
    print()

    chip = gpiod.Chip('/dev/gpiochip4')
    results = {}

    for pin in TESTABLE_PINS:
        try:
            line_settings = {pin: gpiod.LineSettings(direction=Direction.INPUT, bias=Bias.PULL_UP)}
            request = chip.request_lines(consumer="button-scan", config=line_settings)

            print(f"Testing GPIO{pin}... Press the button now!", end=' ', flush=True)

            changes = 0
            last_value = None
            start_time = time.time()

            while time.time() - start_time < 2:
                value = request.get_value(pin)
                if last_value is not None and value != last_value:
                    changes += 1
                last_value = value
                time.sleep(0.01)

            request.release()

            if changes > 0:
                print(f"✓ Detected {changes} changes!")
                results[pin] = changes
            else:
                print("✗ No changes")

        except Exception as e:
            print(f"✗ (Error: {e})")

    print()
    if results:
        print("Pins that detected button presses:")
        for pin, changes in sorted(results.items(), key=lambda x: x[1], reverse=True):
            print(f"  GPIO{pin}: {changes} changes")
    else:
        print("No button activity detected on any pin.")

def main():
    print("=" * 60)
    print("GPIO Pin Scanner for Winston Slots")
    print("=" * 60)
    print()
    print("This will test all available GPIO pins to find:")
    print("  1. Which pin controls your LED")
    print("  2. Which pin detects your button")
    print()
    print("Make sure gpio-daemon is stopped first:")
    print("  sudo systemctl stop gpio-daemon")
    print()
    input("Press Enter to start...")

    try:
        # Part 1: Find LED pin
        test_output_pins()

        # Part 2: Find button pin
        test_input_pins()

        print()
        print("=" * 60)
        print("Scan complete!")
        print("=" * 60)
        print()
        print("Update the GPIO daemon with the correct pins:")
        print("  1. Edit scripts/gpio_daemon_gpiod.py")
        print("  2. Change BUTTON_PIN and LED_PIN to the detected values")
        print("  3. Restart the daemon: sudo systemctl restart gpio-daemon")
        print()

    except Exception as e:
        print(f"\nError: {e}")
        print("\nMake sure gpio-daemon is stopped:")
        print("  sudo systemctl stop gpio-daemon")

if __name__ == "__main__":
    main()

# Raspberry Pi 5 Kiosk Setup Guide

This guide will help you set up a Raspberry Pi 5 to display the Winston Slots TV interface in kiosk mode, optimized for graphics-intensive rendering.

## Hardware Requirements

- Raspberry Pi 5 (4GB or 8GB recommended)
- MicroSD card (32GB+ recommended)
- HDMI display
- Power supply
- Keyboard (for initial setup)
- Arcade button with integrated LED
- Jumper wires for GPIO connections

## GPIO Wiring

Connect the arcade button to the Raspberry Pi:

| Component | GPIO Pin | Physical Pin | Notes |
|-----------|----------|--------------|-------|
| Button Switch | GPIO17 | Pin 11 | Connect other wire to GND |
| Button LED (+) | GPIO23 | Pin 16 | Connect through 220Ω resistor |
| Ground (GND) | GND | Pin 6, 9, 14, 20, 25, 30, 34, or 39 | Common ground for both |

**Wiring Diagram:**
```
Arcade Button:
  Switch Terminal 1 → GPIO17 (Pin 11)
  Switch Terminal 2 → GND (Pin 9)
  LED Positive (+)  → GPIO23 (Pin 16) + 220Ω Resistor
  LED Negative (-)  → GND (Pin 9)
```

## Initial Setup

### 1. Flash Raspberry Pi OS

1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Flash **Raspberry Pi OS (64-bit) with Desktop**
3. Configure WiFi and SSH in advanced options
4. Boot the Pi and complete initial setup

### 2. Transfer Setup Scripts

From your development machine:

```bash
# Copy the entire project to the Pi
rsync -avz --exclude 'node_modules' --exclude '.git' \
  /Users/ethanbyrum/dev/winston-slots/ \
  pi@192.168.100.153:~/winston-slots/
```

Or clone from Git:

```bash
ssh pi@192.168.100.153
git clone https://github.com/ebyrum00/eteam-slot-machine.git ~/winston-slots
cd ~/winston-slots
```

### 3. Run Hardware Optimization Setup

SSH into your Pi and run:

```bash
cd ~/winston-slots/scripts
chmod +x *.sh
./pi-setup.sh
```

This script will:
- Update system packages
- Install Chromium with hardware acceleration
- Configure GPU memory allocation (256MB)
- Enable hardware video decoding
- Disable unnecessary services
- Optimize for graphics performance

**Reboot after this step:**

```bash
sudo reboot
```

### 4. Install GPIO Daemon

Install the GPIO daemon for arcade button control:

```bash
cd ~/winston-slots/scripts

# Install GPIO daemon and dependencies
./install-gpio-service.sh
```

This will:
- Install Python GPIO libraries
- Create systemd service for button monitoring
- Configure GPIO17 for button switch input
- Configure GPIO23 for LED output
- Start the daemon automatically on boot

**LED Behavior:**
- **OFF** - Idle state (no player registered)
- **PULSING** - Ready state (form completed, ready to spin)
- **ON** - Spinning or showing results

**Check GPIO daemon status:**
```bash
sudo systemctl status gpio-daemon
sudo journalctl -u gpio-daemon -f  # View live logs
```

### 5. Configure Kiosk Mode

After GPIO setup, configure kiosk mode:

```bash
cd ~/winston-slots/scripts

# Configure for TV display (default: http://localhost:5173?display=tv)
./pi-kiosk-config.sh

# Or specify a custom URL
./pi-kiosk-config.sh "http://<backend-server-ip>:5173?display=tv"
```

This configures:
- Auto-login on boot
- Chromium kiosk mode with optimized flags
- Hardware acceleration enabled
- Screen blanking disabled
- Cursor hidden
- Compositor for smooth animations

### 6. Final Reboot

```bash
sudo reboot
```

The Pi will now automatically:
1. Boot to desktop
2. Auto-login as user `pi`
3. Start GPIO daemon (monitoring button)
4. Launch Chromium in fullscreen kiosk mode
5. Display the slot machine interface

## Button Operation

The arcade button follows this workflow:

1. **Idle State** - LED is OFF
   - Button presses are ignored
   - Waiting for player registration

2. **Player Registers** - User fills out form on iPad
   - Backend updates game state to "ready"
   - GPIO daemon receives state change via WebSocket

3. **Ready State** - LED begins PULSING
   - Button is now active and ready for press
   - LED pulses to attract player attention

4. **Button Pressed** - Player hits the arcade button
   - GPIO daemon detects button press on GPIO17
   - Creates spin via API
   - Updates game state to "spinning"
   - LED switches to solid ON

5. **Spinning** - LED stays solid ON
   - Reels animate on display
   - Button presses are ignored

6. **Results** - LED stays solid ON
   - Shows win/loss animation
   - After timeout, returns to idle
   - LED turns OFF

## Chromium Optimization Flags

The setup includes these performance optimizations:

- `--enable-gpu-rasterization` - Use GPU for rendering
- `--enable-accelerated-2d-canvas` - Hardware canvas acceleration
- `--enable-accelerated-video-decode` - Hardware video decoding
- `--enable-features=VaapiVideoDecoder` - Video acceleration API
- `--use-gl=egl` - Use EGL for OpenGL
- `--ignore-gpu-blocklist` - Force GPU acceleration
- `--num-raster-threads=4` - Multi-threaded rasterization
- `--disable-background-timer-throttling` - Prevent animation throttling

## Changing the Display URL

Edit the autostart script:

```bash
nano ~/.config/openbox/autostart
```

Change the URL in the last line, then restart:

```bash
sudo reboot
```

## Optional: Watchdog Service

To automatically restart Chromium if it crashes:

```bash
cd ~/winston-slots/scripts
./create-kiosk-service.sh "http://localhost:5173?display=tv"
sudo systemctl start kiosk-watchdog
```

## Troubleshooting

### GPIO/Button Issues

**Button not responding:**
```bash
# Check GPIO daemon is running
sudo systemctl status gpio-daemon

# View live logs
sudo journalctl -u gpio-daemon -f

# Test GPIO manually
python3 -c "import RPi.GPIO as GPIO; GPIO.setmode(GPIO.BCM); GPIO.setup(17, GPIO.IN, pull_up_down=GPIO.PUD_UP); print('Button state:', GPIO.input(17))"
```

**LED not working:**
```bash
# Test LED manually
python3 << EOF
import RPi.GPIO as GPIO
import time
GPIO.setmode(GPIO.BCM)
GPIO.setup(23, GPIO.OUT)
GPIO.output(23, GPIO.HIGH)
time.sleep(2)
GPIO.output(23, GPIO.LOW)
GPIO.cleanup()
print("LED test complete")
EOF
```

**Check wiring:**
- Button switch: GPIO17 (Pin 11) and GND (Pin 9)
- LED: GPIO23 (Pin 16) through 220Ω resistor to GND
- Verify connections with multimeter
- Check for loose jumper wires

**Restart GPIO daemon:**
```bash
sudo systemctl restart gpio-daemon
sudo journalctl -u gpio-daemon -f
```

### Black screen on boot

1. Check GPU memory allocation:
   ```bash
   vcgencmd get_mem gpu
   # Should show: gpu=256M
   ```

2. Check display output:
   ```bash
   DISPLAY=:0 xrandr
   ```

### Chromium not starting

Check logs:
```bash
cat ~/.xsession-errors
journalctl -u lightdm -b
```

Manually test Chromium:
```bash
DISPLAY=:0 chromium-browser --version
```

### Performance issues

1. Monitor GPU temperature:
   ```bash
   vcgencmd measure_temp
   ```

2. Check if hardware acceleration is active:
   ```bash
   DISPLAY=:0 chromium-browser chrome://gpu
   ```

3. Increase GPU memory (if needed):
   ```bash
   sudo nano /boot/firmware/config.txt
   # Change: gpu_mem=512
   sudo reboot
   ```

### Remote access for debugging

Enable VNC:
```bash
sudo raspi-config
# Interface Options -> VNC -> Enable
```

Or use X11 forwarding:
```bash
ssh -X pi@<pi-ip-address>
```

## Network Configuration

### Connecting to Backend Server

If the backend runs on a different machine:

```bash
# Update the kiosk URL
./pi-kiosk-config.sh "http://<backend-ip>:5173?display=tv"
```

### Static IP (recommended)

```bash
sudo nano /etc/dhcpcd.conf
```

Add:
```
interface wlan0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1 8.8.8.8
```

## Performance Monitoring

Create a monitoring script:

```bash
#!/bin/bash
# Save as ~/monitor.sh

echo "=== System Status ==="
echo "Temperature: $(vcgencmd measure_temp)"
echo "GPU Memory: $(vcgencmd get_mem gpu)"
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%"
echo "Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Chromium Running: $(pgrep -x chromium-browser > /dev/null && echo 'Yes' || echo 'No')"
```

## Maintenance

### Update the application

```bash
cd ~/winston-slots
git pull
sudo reboot  # Refresh the browser
```

### Clear browser cache

```bash
rm -rf ~/.cache/chromium
sudo reboot
```

### Force refresh without reboot

```bash
pkill chromium-browser
# It will auto-restart via openbox
```

## Production Checklist

- [ ] Static IP configured
- [ ] Backend server accessible from Pi
- [ ] Display resolution set correctly
- [ ] Auto-login enabled
- [ ] Kiosk mode launches on boot
- [ ] Watchdog service enabled (optional)
- [ ] Screen blanking disabled
- [ ] Cursor hidden
- [ ] GPU memory allocated (256MB+)
- [ ] Hardware acceleration verified
- [ ] Network stability tested
- [ ] Remote access configured for maintenance

## Additional Resources

- [Raspberry Pi Documentation](https://www.raspberrypi.com/documentation/)
- [Chromium Command Line Flags](https://peter.sh/experiments/chromium-command-line-switches/)
- [Pi Performance Tuning](https://github.com/raspberrypi/firmware/blob/master/boot/overlays/README)

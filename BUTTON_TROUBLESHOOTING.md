# Button Press Troubleshooting Guide

## Quick Diagnostic Steps

### On the Raspberry Pi, run:
```bash
./scripts/diagnose_button.sh
```

This will check:
1. GPIO daemon service status
2. Recent logs for errors
3. Current game state
4. GPIO pin configuration
5. Real-time button press monitoring

---

## Common Issues and Solutions

### Issue 1: Button Press Not Detected

**Symptoms:**
- Button press does nothing in ready state
- No logs showing "Button press detected" in journalctl

**Diagnostic:**
```bash
# Check if GPIO daemon is running
systemctl status gpio-daemon.service

# Watch logs in real-time while pressing button
sudo journalctl -u gpio-daemon.service -f
```

**Possible Causes:**

1. **GPIO daemon not running**
   ```bash
   sudo systemctl start gpio-daemon.service
   sudo systemctl enable gpio-daemon.service
   ```

2. **Button monitoring thread crashed**
   - Check logs for errors: `sudo journalctl -u gpio-daemon.service -n 100`
   - Restart daemon: `sudo systemctl restart gpio-daemon.service`

3. **Hardware/wiring issue**
   ```bash
   # Test button directly (should toggle between 0 and 1)
   watch -n 0.1 'cat /sys/class/gpio/gpio17/value'
   # Press button - value should change from 1 to 0
   ```

4. **Debounce too aggressive**
   - Check `time.sleep(0.3)` in button_pressed() (line 119)
   - Try reducing to `time.sleep(0.1)`

---

### Issue 2: Button Press Ignored - Not in Ready State

**Symptoms:**
- Logs show: "Button press ignored - not in ready state"
- Current state is not 'ready'

**Diagnostic:**
```bash
# Check current game state
curl http://localhost:3000/api/game_state | jq
```

**Solutions:**

1. **State stuck in wrong state**
   ```bash
   # Reset game state to idle
   curl -X POST http://localhost:3000/api/game_state \
     -H "Content-Type: application/json" \
     -d '{"state": "idle"}'
   ```

2. **WebSocket not receiving state updates**
   - Check WebSocket connection in daemon logs
   - Look for "WebSocket connection established" message
   - Restart daemon if connection lost

3. **Player not registered**
   ```bash
   # Check if player_id is set
   # In daemon logs, look for: "Player registered: [player_name] (ID: [id])"
   ```

---

### Issue 3: Button Press Ignored - No Player Registered

**Symptoms:**
- Logs show: "Button press ignored - no player registered"
- current_player_id is None

**Diagnostic:**
```bash
# Check game state
curl http://localhost:3000/api/game_state | jq '.current_player_id'
```

**Solutions:**

1. **Register a player from iPad**
   - Go to iPad app
   - Enter player name
   - Click "Register to Play"

2. **Manually register a test player**
   ```bash
   # Create test player
   curl -X POST http://localhost:3000/api/players \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Player"}'

   # Set game state to ready with player
   curl -X POST http://localhost:3000/api/game_state \
     -H "Content-Type: application/json" \
     -d '{"state": "ready", "player_id": 1, "player_name": "Test Player"}'
   ```

---

### Issue 4: API Request Failing

**Symptoms:**
- Logs show: "Failed to create spin: 500" or "Error creating spin"
- Button press detected but spin not created

**Diagnostic:**
```bash
# Check if backend is running
curl http://localhost:3000/up

# Check backend logs
tail -f log/development.log
```

**Solutions:**

1. **Backend not running**
   ```bash
   cd /home/pi/winston-slots
   ./bin/dev
   ```

2. **Database issue**
   ```bash
   cd /home/pi/winston-slots
   rails db:migrate
   rails db:seed  # If needed
   ```

3. **Network/firewall issue**
   - Check BACKEND_URL in gpio_daemon_gpiod.py (should be http://localhost:3000)
   - Test API manually: `curl -X POST http://localhost:3000/api/spins -H "Content-Type: application/json" -d '{"player_id": 1}'`

---

## GPIO Daemon Code Flow

When button is pressed in 'ready' state:

1. **Button monitoring thread** (line 108-122)
   - Polls GPIO17 every 10ms
   - Detects falling edge (1 → 0)
   - Calls `button_pressed()`
   - Debounces with 300ms delay

2. **Button press handler** (line 124-138)
   - Logs: "Button pressed! Current state: {state}"
   - Checks state == 'ready' → else logs "ignored - not in ready state"
   - Checks current_player_id exists → else logs "ignored - no player registered"
   - Calls `create_spin()`

3. **Create spin API call** (line 140-157)
   - POST to `/api/spins` with player_id
   - Logs success or error
   - Backend broadcasts state change to 'spinning'

4. **WebSocket receives state change**
   - Updates current_state to 'spinning'
   - Changes LED to solid ON

---

## Quick Tests

### Test 1: Manual button trigger
```bash
# Simulate button press (if using RPi.GPIO)
echo 0 > /sys/class/gpio/gpio17/value
sleep 0.1
echo 1 > /sys/class/gpio/gpio17/value
```

### Test 2: API endpoint test
```bash
# Create a test player and spin
curl -X POST http://localhost:3000/api/players \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}' | jq

curl -X POST http://localhost:3000/api/game_state \
  -H "Content-Type: application/json" \
  -d '{"state": "ready", "player_id": 1, "player_name": "Test"}' | jq

curl -X POST http://localhost:3000/api/spins \
  -H "Content-Type: application/json" \
  -d '{"player_id": 1}' | jq
```

### Test 3: Check LED
```bash
# LED should pulse in ready state
# If LED is off, daemon might not be running or state is not 'ready'
cat /sys/class/gpio/gpio27/value
# Should toggle between 0 and 1 when pulsing
```

---

## Logs Location

- **GPIO Daemon:** `sudo journalctl -u gpio-daemon.service -f`
- **Rails Backend:** `tail -f log/development.log`
- **Frontend (if running):** Check browser console

---

## Contact Points for Debugging

1. **Button press detection:** gpio_daemon_gpiod.py line 108-122
2. **Button press handling:** gpio_daemon_gpiod.py line 124-138
3. **API call:** gpio_daemon_gpiod.py line 140-157
4. **State validation:** gpio_daemon_gpiod.py line 129-135
5. **Backend spin creation:** app/controllers/api/spins_controller.rb

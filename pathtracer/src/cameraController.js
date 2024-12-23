// CameraController.js
class CameraController {
  constructor(initialPos = [0, 0, 0], initialRot = [0, 0, 0]) {
    this.pos = [...initialPos];
    this.rot = [...initialRot]; // rot[0] = pitch, rot[1] = yaw, rot[2] = roll

    // Fly mode variables
    this.flyMode = false;

    // Keys state
    this.keys = {
      KeyW: false,
      KeyA: false,
      KeyS: false,
      KeyD: false,
      KeyQ: false,
      KeyE: false,
    };

    // Sensitivity and movement speed
    this.sensitivity = 0.002;
    this.moveSpeed = 2.5; // units per second

    // For mouse handling
    this.maxPitch = Math.PI / 2 - 0.001;
  }

  toggleFlyMode() {
    this.flyMode = !this.flyMode;
    if (this.flyMode) {
      if (document.pointerLockElement !== document.body) {
        document.body.requestPointerLock();
      }
    } else {
      if (document.pointerLockElement === document.body) {
        document.exitPointerLock();
      }
    }
  }

  handleKeyDown(e) {
    if (this.keys.hasOwnProperty(e.code)) {
      this.keys[e.code] = true;
    }
  }

  handleKeyUp(e) {
    if (this.keys.hasOwnProperty(e.code)) {
      this.keys[e.code] = false;
    }
  }

  handleMouseMove(e) {
    if (!this.flyMode) return;
    if (document.pointerLockElement !== document.body) return;

    const dx = e.movementX;
    const dy = e.movementY;

    // Mouse right should turn camera to the right: decrease yaw when moving mouse right
    this.rot[1] -= dx * this.sensitivity;
    // Mouse up should look up: decreasing pitch when moving mouse up
    this.rot[0] -= dy * this.sensitivity;

    // Clamp pitch
    if (this.rot[0] > this.maxPitch) this.rot[0] = this.maxPitch;
    if (this.rot[0] < -this.maxPitch) this.rot[0] = -this.maxPitch;
  }

  update(deltaTime) {
    // Handle fly mode movement
    if (!this.flyMode) return;

    let forwardMove = 0;
    let rightMove = 0;
    let upMove = 0;

    if (this.keys["KeyW"]) forwardMove += 1;
    if (this.keys["KeyS"]) forwardMove -= 1;
    if (this.keys["KeyA"]) rightMove -= 1;
    if (this.keys["KeyD"]) rightMove += 1;
    if (this.keys["KeyQ"]) upMove -= 1;
    if (this.keys["KeyE"]) upMove += 1;

    const len = Math.sqrt(
      forwardMove * forwardMove + rightMove * rightMove + upMove * upMove
    );
    if (len > 0) {
      forwardMove /= len;
      rightMove /= len;
      upMove /= len;
    }

    const pitch = this.rot[0];
    const yaw = this.rot[1];

    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);

    // Forward vector (assuming forward along +Z at yaw=0, pitch=0)
    const forwardX = -sinYaw * cosPitch;
    const forwardY = sinPitch;
    const forwardZ = cosYaw * cosPitch;

    // Right vector
    const rightX = forwardZ;
    const rightY = 0;
    const rightZ = -forwardX;
    const rightLen = Math.sqrt(
      rightX * rightX + rightY * rightY + rightZ * rightZ
    );
    const normRightX = rightX / rightLen;
    const normRightY = rightY / rightLen;
    const normRightZ = rightZ / rightLen;

    // Up vector from cross(forward, right)
    const upX = forwardY * normRightZ - forwardZ * normRightY;
    const upY = forwardZ * normRightX - forwardX * normRightZ;
    const upZ = forwardX * normRightY - forwardY * normRightX;
    const upLen = Math.sqrt(upX * upX + upY * upY + upZ * upZ);
    const normUpX = upX / upLen;
    const normUpY = upY / upLen;
    const normUpZ = upZ / upLen;

    const moveX =
      forwardMove * forwardX + rightMove * normRightX + upMove * normUpX;
    const moveY =
      forwardMove * forwardY + rightMove * normRightY + upMove * normUpY;
    const moveZ =
      forwardMove * forwardZ + rightMove * normRightZ + upMove * normUpZ;

    this.pos[0] += moveX * this.moveSpeed * deltaTime;
    this.pos[1] += moveY * this.moveSpeed * deltaTime;
    this.pos[2] += moveZ * this.moveSpeed * deltaTime;
  }
}

export default CameraController;

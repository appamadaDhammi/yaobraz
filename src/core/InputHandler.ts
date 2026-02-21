export interface InputState {
  x: number;
  y: number;
  isPressed: boolean;
  justPressed: boolean;
  justReleased: boolean;
}

export class InputHandler {
  private state: InputState = {
    x: 0,
    y: 0,
    isPressed: false,
    justPressed: false,
    justReleased: false,
  };

  private element: HTMLElement | SVGElement | HTMLCanvasElement;
  private scale: number;

  constructor(element: HTMLElement | SVGElement | HTMLCanvasElement, scale: number = 30) {
    this.element = element;
    this.scale = scale;
    this.setupListeners();
  }

  private setupListeners() {
    // Prevent default browser touch actions (scrolling, zooming)
    this.element.style.touchAction = 'none';

    const handleDown = (e: PointerEvent) => {
      // Capture the pointer to this element to insure we get move/up events even 
      // if the pointer leaves the element boundaries during interaction.
      this.element.setPointerCapture(e.pointerId);
      
      this.state.isPressed = true;
      this.state.justPressed = true;
      this.updatePosition(e);
      
      e.preventDefault();
      e.stopPropagation();
    };

    const handleUp = (e: PointerEvent) => {
      this.element.releasePointerCapture(e.pointerId);
      this.state.isPressed = false;
      this.state.justReleased = true;
      
      e.preventDefault();
      e.stopPropagation();
    };

    const handleMove = (e: PointerEvent) => {
      this.updatePosition(e);
      if (this.state.isPressed) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    this.element.addEventListener('pointerdown', handleDown as EventListener);
    window.addEventListener('pointerup', handleUp as EventListener);
    window.addEventListener('pointermove', handleMove as EventListener);
    
    // Optional: handle pointercancel (e.g. system interrupt) as a release
    window.addEventListener('pointercancel', handleUp as EventListener);
  }

  private updatePosition(e: PointerEvent) {
    const rect = this.element.getBoundingClientRect();
    
    // Pointer Events provide clientX/clientY directly for all input types
    const clientX = e.clientX;
    const clientY = e.clientY;

    // Convert to relative coordinates (0 to width, 0 to height)
    // Then to physics world coordinates (origin at bottom-left)
    this.state.x = (clientX - rect.left) / this.scale;
    this.state.y = (rect.bottom - clientY) / this.scale;
  }

  public getState(): InputState {
    const currentState = { ...this.state };
    // Reset "just" flags after reading
    this.state.justPressed = false;
    this.state.justReleased = false;
    return currentState;
  }
}

interface targetData {
  target: HTMLElement;
}

interface positionData {
  target: HTMLElement;
  pageX: number;
  pageY: number;
}

export default class DragDrop {
  active = false;
  dragging = false;
  currentDragTarget: HTMLElement | null = null;
  dragGhost: HTMLElement | null = null;
  placeholder: HTMLElement | null = null;
  dragSelector: string = null;
  dropSelector: string = null;
  listeners: { [event: string]: Array<(element?: HTMLElement) => void> } = {
    start: [],
    move: [],
    end: [],
  };

  constructor(dragSelector = "body *", dropSelector = "body *") {
    this.dragSelector = dragSelector;
    this.dropSelector = dropSelector;
  }

  activate(): void {
    this.active = true;
    document.addEventListener("mouseover", this.setHoverState);
    document.addEventListener("mousedown", this.dragStart);
    document.addEventListener("contextmenu", this.dragEnd);
  }

  deactivate(): void {
    this.active = false;
    this.dragging = false;
    this.dragGhost && this.dragGhost.remove();
    document.removeEventListener("mouseover", this.setHoverState);
    document.removeEventListener("mousedown", this.dragStart);
    document.removeEventListener("contextmenu", this.dragEnd);
    this.removeArtifacts();
  }

  removeArtifacts(): void {
    document
      .querySelectorAll(".dnd-draggable, .dnd-hovered")
      .forEach((element: Element) => {
        element.classList.remove("dnd-draggable", "dnd-hovered");
      });
  }

  on(event: string, callback: (element?: HTMLElement) => void[]): void {
    this.listeners[event].push(callback);
  }

  off(event: string, callback: (element?: HTMLElement) => void[]): void {
    this.listeners[event] = this.listeners[event].filter(
      (storedCallback) => storedCallback !== callback
    );
  }

  fireEvent(event: string, element?: HTMLElement): void {
    this.listeners[event].forEach((callback) => callback(element));
  }

  setDraggableElementClass(): void {
    const invalidPositionStyles = ["absolute", "fixed", "sticky"];
    document.querySelectorAll(this.dragSelector).forEach((element: Element) => {
      if (!invalidPositionStyles.includes(getComputedStyle(element).position)) {
        element.classList.add("dnd-draggable");
      }
    });
  }

  setHoverState = (e: MouseEvent | targetData): void => {
    document.querySelectorAll(".dnd-hovered").forEach((element: Element) => {
      element.classList.remove("dnd-hovered");
    });
    let target = e.target as HTMLElement;
    if (this.dragging) {
      return;
    }
    if (target.matches(this.dragSelector)) {
      target.classList.add("dnd-hovered");
    } else if (target.closest(this.dragSelector)) {
      target = target.closest(this.dragSelector);
      target.classList.add("dnd-hovered");
    }

    this.currentDragTarget = target;
  };

  dragStart = (e: MouseEvent | positionData): void => {
    let target = e.target as HTMLElement;
    if (
      !target.matches(this.dragSelector) &&
      target.closest(this.dragSelector)
    ) {
      target = target.closest(this.dragSelector);
    }
    if (
      target.matches("body") ||
      target.querySelector("body") ||
      !target.matches(this.dragSelector)
    ) {
      return;
    }
    this.fireEvent("start", target);
    this.setDraggableElementClass();
    this.dragging = true;
    this.currentDragTarget.classList.remove("dnd-hovered");
    this.currentDragTarget.classList.add("dnd-dragging");
    this.dragGhost = document.createElement("div");
    this.dragGhost.classList.add("dnd-drag-ghost");
    document.body.appendChild(this.dragGhost);
    document.addEventListener("mousemove", this.dragMove);
    document.addEventListener("mouseup", this.dragEnd);
    this.dragMove(e);
  };

  dragMove = (e: MouseEvent | positionData): void => {
    const widthOffset = this.dragGhost.clientWidth / 2;
    const heightOffset = this.dragGhost.clientHeight / 2;
    this.dragGhost.style.left = e.pageX - widthOffset + "px";
    this.dragGhost.style.top = e.pageY - heightOffset + "px";
    this.setPlaceholder(e);
    this.fireEvent("move");
  };

  dragEnd = (e: MouseEvent | targetData): void => {
    this.fireEvent("end", e.target as HTMLElement);
    this.dragging = false;
    document.querySelectorAll(".dnd-dragging").forEach((element: Element) => {
      element.classList.remove("dnd-dragging");
    });
    this.dragGhost && this.dragGhost.remove();
    this.dragGhost = null;
    this.placeholder && this.placeholder.replaceWith(this.currentDragTarget);
    this.placeholder = null;
    this.removeArtifacts();
    this.currentDragTarget.classList.add("dnd-hovered");
    document.removeEventListener("mousemove", this.dragMove);
    document.removeEventListener("mouseup", this.dragEnd);
  };

  setPlaceholder(e: MouseEvent | positionData): void {
    let currentDropTarget = e.target as HTMLElement;
    if (
      !currentDropTarget.matches(this.dropSelector) &&
      !currentDropTarget.matches(this.dragSelector) &&
      currentDropTarget.querySelector(this.dropSelector)
    ) {
      currentDropTarget = currentDropTarget.querySelector(this.dropSelector);
    }
    if (
      !currentDropTarget.matches(this.dropSelector) &&
      !currentDropTarget.matches(this.dragSelector)
    ) {
      return;
    }
    if (
      currentDropTarget === this.currentDragTarget ||
      this.currentDragTarget.contains(currentDropTarget)
    ) {
      this.placeholder && this.placeholder.remove();
      this.placeholder = null;
      return;
    }
    if (
      this.placeholder &&
      (this.placeholder === currentDropTarget.nextElementSibling ||
        this.placeholder === currentDropTarget.previousElementSibling)
    ) {
      this.positionPlaceholder(e, currentDropTarget);
      return;
    }
    this.placeholder && this.placeholder.remove();
    this.placeholder = document.createElement("span");
    this.placeholder.classList.add("dnd-placeholder");
    currentDropTarget.before(this.placeholder);
    this.positionPlaceholder(e, currentDropTarget);
  }

  positionPlaceholder(
    e: MouseEvent | positionData,
    currentDropTarget: HTMLElement
  ): void {
    const isBefore =
      this.placeholder === currentDropTarget.previousElementSibling;
    const shouldBeBefore =
      (this.placeholderShouldBeVertical(currentDropTarget) &&
        this.overLeftHalf(e)) ||
      (!this.placeholderShouldBeVertical(currentDropTarget) &&
        this.overTopHalf(e));
    this.placeholder.style.width = "0";
    this.placeholder.style.height = "0";
    this.placeholder.style.display = "";
    if (this.placeholderShouldBeVertical(currentDropTarget)) {
      this.placeholder.style.height =
        currentDropTarget.getBoundingClientRect().height + "px";
    } else {
      this.placeholder.style.display = "block";
      this.placeholder.style.width =
        currentDropTarget.getBoundingClientRect().width + "px";
    }
    if (isBefore && !shouldBeBefore) {
      currentDropTarget.after(this.placeholder);
    } else if (!isBefore && shouldBeBefore) {
      currentDropTarget.before(this.placeholder);
    }
    if (
      currentDropTarget.matches(this.dropSelector) &&
      currentDropTarget.parentElement &&
      !currentDropTarget.parentElement.matches(this.dropSelector)
    ) {
      currentDropTarget.appendChild(this.placeholder);
    }
  }

  placeholderShouldBeVertical(currentDropTarget: HTMLElement): boolean {
    let isVertical = true;
    const orientationFinder = document.createElement("span");
    orientationFinder.classList.add("dnd-orientation-finder");
    currentDropTarget.after(orientationFinder);
    if (orientationFinder.offsetTop > currentDropTarget.offsetTop) {
      isVertical = false;
    }
    orientationFinder.remove();
    return isVertical;
  }

  overTopHalf(e: MouseEvent | positionData): boolean {
    const currentDropTarget = e.target as HTMLElement;
    if (
      currentDropTarget.getBoundingClientRect().top +
        currentDropTarget.getBoundingClientRect().height / 2 >
      e.pageY
    ) {
      return true;
    }
    return false;
  }

  overLeftHalf(e: MouseEvent | positionData): boolean {
    const currentDropTarget = e.target as HTMLElement;
    if (
      currentDropTarget.getBoundingClientRect().left +
        currentDropTarget.getBoundingClientRect().width / 2 <
      e.pageX
    ) {
      return false;
    }
    return true;
  }
}

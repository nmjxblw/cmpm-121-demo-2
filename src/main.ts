import "./style.css";
("use strict");

const app: HTMLDivElement = document.querySelector("#app")!;

//test line
const gameName = "Zhuo's game";

document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

interface Point {
  x: number;
  y: number;
}

enum ToolType {
  pen,
  sticker,
}

//step1
//setp2
const canvas = document.createElement("canvas");
const canvasScale = 256;
const HALF_SCALE = 128;
const TEMP_CANVAS_SCALE_MULTIPLIER = 4;
canvas.width = canvasScale;
canvas.height = canvasScale;
canvas.style.border = "thin solid black";
canvas.style.borderRadius = "20px";
canvas.style.filter = "drop-shadow(0 0 1px crimson)";
app.append(document.createElement("br"));
app.append(canvas);
const ctx = canvas.getContext("2d");
ctx!.fillStyle = "white";

//magic numbers and default setting
const FIRST_INDEX = 0;
const LINE_WIDTH = 4;
const ORIGIN: Point = { x: 0, y: 0 };
const MAX_LEVEL = 8;
const MIN_LEVEL = 1;
const RATIO = 1.5;
const START_ANGLE = 0;
const DEFAULT_RADIUS = 1;
const EMOJI_DEFAULT = 32;
const LEFT_BUTTON_NUMBER = 1;
const PI_CONST = 2;
const TWO_PI = PI_CONST * Math.PI;
const regex = /[.,#!$%&;:{}=\-_`~()\s\t]+/;

//global variables
let lineWidth = LINE_WIDTH;
let scaleLevel = 5;
let cursorCommand: CursorCommand | null = null;
let currentCommand: LineCommand | StickerCommand | null = null;
let toolPreview: ToolPreview | null = null;
let currentTool: ToolType = ToolType.pen;
let currentSticker: string;
let emojiArray: string[] = ["😃", "♥", "⭐"];
const buttonArray: Button[] = [];
const commands: (LineCommand | StickerCommand)[] = [];
const redoCommands: (LineCommand | StickerCommand)[] = [];
const bus = new EventTarget();
const colorInput = document.createElement("input");
colorInput.type = "color";
let currentColor = colorInput.value;

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

bus.addEventListener("drawing-changed", redraw);
bus.addEventListener("cursor-changed", redraw);
bus.addEventListener("scale-changed", () => {
  currentLineWidthElement.innerHTML = `Size Level:${scaleLevel}`;
});
bus.addEventListener("tool-moved", () => {
  if (toolPreview) {
    ctx!.clearRect(ORIGIN.x, ORIGIN.y, canvas.width, canvas.height);
    commands.forEach((cmd) => cmd.execute());
    toolPreview.draw(ctx!);
  }
});

function redraw() {
  ctx!.clearRect(ORIGIN.x, ORIGIN.y, canvas.width, canvas.height);

  commands.forEach((cmd) => cmd.execute());

  //draw a cursor if
  if (cursorCommand) {
    cursorCommand.execute();
  }
}

class ToolPreview {
  private _x: number;
  private _y: number;
  private _radius: number;
  private _sticker: string;
  private _toolType: ToolType;
  private _size: number;

  constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
    this._toolType = currentTool;
    this._radius = (lineWidth / LINE_WIDTH) * DEFAULT_RADIUS;
    this._sticker = currentTool == ToolType.sticker ? currentSticker : "";
    this._size = Math.round((EMOJI_DEFAULT * scaleLevel) / MAX_LEVEL);
  }

  get toolType() {
    return this._toolType;
  }
  set toolType(toolType: ToolType) {
    this._toolType = toolType;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this._toolType == ToolType.pen) {
      ctx.beginPath();

      ctx.arc(this._x, this._y, this._radius, START_ANGLE, TWO_PI);
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    } else if (this._toolType == ToolType.sticker) {
      ctx.font = `${this._size}px sans-serif`;
      ctx.fillText(this._sticker, this._x, this._y);
    }
  }
}

class LineCommand {
  public points: Point[];
  public width: number;
  public style: string;
  constructor(x: number, y: number, width?: number) {
    this.points = [{ x, y }];
    this.width = width ?? lineWidth;
    this.style = currentColor;
  }
  execute(context?: CanvasRenderingContext2D) {
    context = context ?? ctx!;
    context.strokeStyle = this.style;
    context.lineWidth = this.width;
    context.beginPath();
    const { x, y } = this.points[FIRST_INDEX];
    context.moveTo(x, y);
    for (const { x, y } of this.points) {
      context.lineTo(x, y);
    }
    context.stroke();
  }
  grow(x: number, y: number) {
    this.points.push({ x, y });
  }
}

class StickerCommand {
  public position: Point;
  public emoji: string;
  public x: number;
  public y: number;
  private _size: number;

  constructor(emoji: string, position?: Point) {
    this.emoji = emoji;
    this.position = position ?? { x: HALF_SCALE, y: HALF_SCALE };
    this.x = this.position.x;
    this.y = this.position.y;
    this._size = Math.round((EMOJI_DEFAULT * scaleLevel) / MAX_LEVEL);
  }

  get size() {
    return this._size;
  }
  set size(size: number) {
    this._size = size;
  }

  draw(context: CanvasRenderingContext2D): void {
    context.font = `${this._size}px sans-serif`;
    context.fillText(this.emoji, this.x, this.y);
  }
  execute(context?: CanvasRenderingContext2D) {
    context = context ?? ctx!;
    this.draw(context);
  }
}

class CursorCommand {
  public x: number;
  public y: number;
  public offset: Point = { x: -8, y: 16 };
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  execute(context?: CanvasRenderingContext2D) {
    context = context ?? ctx!;
    context.font = `32px monospace`;
    context.fillText("*", this.x + this.offset.x, this.y + this.offset.y);
  }
}

class Button {
  public name: string;
  public onClick?: () => void;
  private _button: HTMLButtonElement;

  constructor(name: string, onClick?: () => void) {
    this.name = name;
    this._button = document.createElement("button");
    this.onClick = onClick;
    this.setOnClickFunction();
  }

  private setOnClickFunction(): void {
    this._button.innerHTML = this.name;

    if (this.onClick) {
      this._button.addEventListener("click", () => {
        this.onClick!();
      });
    } else {
      this._button.addEventListener("click", () => {
        console.log(`There's no onClick for ${this._button.innerHTML}`);
      });
    }
    app.append(this._button);
  }
  remove(): void {
    if (this._button) {
      this._button.remove();
      console.log(`${this._button.innerHTML} has been moved.`);
    }
  }
  setOnClick(onClick: () => void): void {
    this.onClick = onClick;
    if (this._button) {
      this._button.addEventListener("click", () => {
        this.onClick!();
      });
    }
  }
  setName(name: string): void {
    this.name = name;
    if (this._button) {
      this._button.innerHTML = name;
    }
  }
  get innerHTML(): string {
    return this._button.innerHTML;
  }
  set innerHTML(name: string) {
    this.name = name;
    if (this._button) {
      this._button.innerHTML = name;
    }
  }
  get button(): HTMLButtonElement {
    return this._button;
  }
}

canvas.addEventListener("mouseout", () => {
  cursorCommand = null;
  canvas.style.cursor = "default";
  notify("cursor-changed");
});

canvas.addEventListener("mouseenter", (e) => {
  cursorCommand = new CursorCommand(e.offsetX, e.offsetY);
  canvas.style.cursor = "none";
  notify("cursor-changed");
});

canvas.addEventListener("mousemove", (e) => {
  cursorCommand = new CursorCommand(e.offsetX, e.offsetY);
  notify("cursor-changed");
  if (!e.buttons) {
    toolPreview = new ToolPreview(e.offsetX, e.offsetY);
    notify("tool-moved");
  }

  if (
    e.buttons == LEFT_BUTTON_NUMBER &&
    currentCommand instanceof LineCommand
  ) {
    currentCommand.points.push({ x: e.offsetX, y: e.offsetY });
    notify("drawing-changed");
  }
});

canvas.addEventListener("mousedown", (e) => {
  toolPreview = null;
  if (currentTool == ToolType.pen) {
    currentCommand = new LineCommand(e.offsetX, e.offsetY, lineWidth);
  }
  if (currentTool == ToolType.sticker) {
    const position: Point = { x: e.offsetX, y: e.offsetY };
    currentCommand = new StickerCommand(currentSticker, position);
  }

  commands.push(currentCommand!);
  redoCommands.splice(FIRST_INDEX, redoCommands.length);
  notify("drawing-changed");
});

canvas.addEventListener("mouseup", () => {
  currentCommand = null;
  notify("drawing-changed");
});

app.append(document.createElement("br"));

app.append(colorInput);
colorInput.addEventListener("input", () => {
  currentColor = colorInput.value;
});

app.append(document.createElement("br"));

// clean button
new Button("clear", () => {
  commands.splice(FIRST_INDEX, commands.length);
  notify("drawing-changed");
});

//undo button
new Button("undo", () => {
  if (commands.length) {
    const redoCommand: LineCommand | StickerCommand | undefined =
      commands.pop();
    redoCommands.push(redoCommand!);
    notify("drawing-changed");
  }
});

//redo button
new Button("redo", () => {
  if (redoCommands.length) {
    const redoCommand: LineCommand | StickerCommand | undefined =
      redoCommands.pop();
    commands.push(redoCommand!);
    notify("drawing-changed");
  }
});
app.append(document.createElement("br"));

// thin button
new Button("-", () => {
  if (scaleLevel > MIN_LEVEL) {
    lineWidth /= RATIO;
    scaleLevel--;
    notify("scale-changed");
  }
});

// display line width
const currentLineWidthElement = document.createElement("span");
currentLineWidthElement.innerHTML = `Size Level:${scaleLevel}`;
app.append(currentLineWidthElement);

//thick button
new Button("+", () => {
  if (scaleLevel < MAX_LEVEL) {
    lineWidth *= RATIO;
    scaleLevel++;
    notify("scale-changed");
  }
});

app.append(document.createElement("br"));

new Button("pen", () => {
  currentTool = ToolType.pen;
});

app.append(document.createElement("br"));
new Button("Import your emoji!", () => {
  const defaultLength = 3;
  const defaultString: string = emojiArray.length <= defaultLength ? "🍬" : "";
  const userInput = window.prompt("Put your emoji/words here!", defaultString);
  emojiArray = [...emojiArray, ...userInput!.split(regex)];
  updateCustomButton();
});

app.append(document.createElement("br"));
function updateCustomButton() {
  buttonArray.forEach((button) => {
    button.remove();
  });
  let counter = 0;
  emojiArray.forEach((emoji) => {
    buttonArray.push(
      new Button(emoji, () => {
        currentTool = ToolType.sticker;
        currentSticker = emoji;
      })
    );
    counter++;
    const MAX_BUTTON_PER_LINE = 6;
    const R = 0;
    if (counter % MAX_BUTTON_PER_LINE == R) {
      app.append(document.createElement("br"));
    }
  });
}
updateCustomButton();

//step 10
app.append(document.createElement("br"));
const exportButton = new Button("exprot");
exportButton.setOnClick(() => {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvasScale * TEMP_CANVAS_SCALE_MULTIPLIER;
  tempCanvas.height = canvasScale * TEMP_CANVAS_SCALE_MULTIPLIER;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx!.scale(TEMP_CANVAS_SCALE_MULTIPLIER, TEMP_CANVAS_SCALE_MULTIPLIER);
  commands.forEach((cmd) => {
    cmd.execute(tempCtx!);
  });
  const anchor = document.createElement("a");
  anchor.href = tempCanvas.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  anchor.click();
});

import "./style.css";
("use strict");

const app: HTMLDivElement = document.querySelector("#app")!;

//test line
const gameName = "Zhuo's game";

document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

//step1
//setp2
const canvas = document.createElement("canvas");
const canvasScale = 256;
const HALF_SCALE = 128;
canvas.width = canvasScale;
canvas.height = canvasScale;
canvas.style.border = "thin solid black";
canvas.style.borderRadius = "20px";
canvas.style.filter = "drop-shadow(0 0 1px crimson)";
app.append(document.createElement("br"));
document.body.append(canvas);
const ctx = canvas.getContext("2d");
ctx!.fillStyle = "white";

//magic numbers
const FIRST_INDEX = 0;
const LINE_WIDTH = 4;
let lineWidth = LINE_WIDTH;
const lineStyle = "black";
const ORIGIN: Point = { x: 0, y: 0 };
let scaleLevel = 5;
const MAX_LEVEL = 8;
const MIN_LEVEL = 1;
const RATIO = 1.5;
const START_ANGLE = 0;
const DEFAULT_RADIUS = 1;

interface Point {
  x: number;
  y: number;
}

const commands: LineCommand[] = [];
const redoCommands: LineCommand[] = [];

let cursorCommand: CursorCommand | null = null;

const bus = new EventTarget();

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

function redraw() {
  ctx!.clearRect(ORIGIN.x, ORIGIN.y, canvas.width, canvas.height);

  commands.forEach((cmd) => cmd.execute());

  if (cursorCommand) {
    cursorCommand.execute();
  }
}

bus.addEventListener("drawing-changed", redraw);
bus.addEventListener("cursor-changed", redraw);

class LineCommand {
  public points: Point[];
  public width: number;
  public style: string;
  constructor(x: number, y: number, width?: number, style?: string) {
    this.points = [{ x, y }];
    this.width = width ? width : lineWidth;
    this.style = style ? style : lineStyle;
  }
  execute() {
    ctx!.strokeStyle = this.style;
    ctx!.lineWidth = this.width;
    ctx!.beginPath();
    const { x, y } = this.points[FIRST_INDEX];
    ctx!.moveTo(x, y);
    for (const { x, y } of this.points) {
      ctx!.lineTo(x, y);
    }
    ctx!.stroke();
  }
  grow(x: number, y: number) {
    this.points.push({ x, y });
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
  execute() {
    ctx!.font = `32px monospace`;
    ctx!.fillText("*", this.x + this.offset.x, this.y + this.offset.y);
  }
}

let currentLineCommand: LineCommand | null = null;

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

let toolPreview: ToolPreview | null = null;

canvas.addEventListener("mousemove", (e) => {
  cursorCommand = new CursorCommand(e.offsetX, e.offsetY);
  notify("cursor-changed");

  if (!e.buttons) {
    toolPreview = new ToolPreview(e.offsetX, e.offsetY, DEFAULT_RADIUS);
    notify("tool-moved");
  }

  const LEFT_BUTTON_NUMBER = 1;
  if (e.buttons == LEFT_BUTTON_NUMBER && currentLineCommand) {
    currentLineCommand.points.push({ x: e.offsetX, y: e.offsetY });
    notify("drawing-changed");
  }
});

canvas.addEventListener("mousedown", (e) => {
  currentLineCommand = new LineCommand(
    e.offsetX,
    e.offsetY,
    lineWidth,
    lineStyle
  );
  commands.push(currentLineCommand);
  redoCommands.splice(FIRST_INDEX, redoCommands.length);
  notify("drawing-changed");
  toolPreview = null;
});

canvas.addEventListener("mouseup", () => {
  currentLineCommand = null;
  notify("drawing-changed");
});

document.body.append(document.createElement("br"));

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  commands.splice(FIRST_INDEX, commands.length);
  notify("drawing-changed");
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  if (commands.length) {
    const redoCommand: LineCommand | undefined = commands.pop();
    redoCommands.push(redoCommand!);
    notify("drawing-changed");
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoCommands.length) {
    const redoCommand: LineCommand | undefined = redoCommands.pop();
    commands.push(redoCommand!);
    notify("drawing-changed");
  }
});

class Button {
  public name: string;
  public onClick?: () => void;

  constructor(name: string, onClick: () => void) {
    this.name = name;
    this.onClick = onClick;
    this.setOnClickFunction();
  }

  private setOnClickFunction(): void {
    const button = document.createElement("Button");
    button.innerHTML = this.name;

    if (this.onClick) {
      button.addEventListener("click", () => {
        this.onClick!();
      });
    } else {
      button.addEventListener("click", () => {
        console.log(`There's no onClick for ${button.innerHTML}`);
      });
    }
    document.body.appendChild(button);
  }

  setOnClick(onClick: () => void): void {
    this.onClick = onClick;
    const button: HTMLButtonElement | null = document.querySelector("button");
    if (button) {
      button.addEventListener("click", () => {
        this.onClick!();
      });
    }
  }
  setName(name: string): void {
    this.name = name;
    const button: HTMLButtonElement | null = document.querySelector("button");
    if (button) {
      button.innerHTML = this.name;
    }
  }
  get innerHTML(): string {
    const button: HTMLButtonElement | null = document.querySelector("button");
    if (button) {
      return button.innerHTML;
    }
    return "";
  }
  set innerHTML(name: string) {
    this.name = name;
    const button: HTMLButtonElement | null = document.querySelector("button");
    if (button) {
      button.innerHTML = name;
    }
  }
}
document.body.append(document.createElement("br"));
new Button("-", () => {
  if (scaleLevel > MIN_LEVEL) {
    lineWidth /= RATIO;
    scaleLevel--;
    notify("scale-changed");
  }
});

const currentLineWidthElement = document.createElement("p");
currentLineWidthElement.innerHTML = `Width:${scaleLevel}`;
document.body.appendChild(currentLineWidthElement);

new Button("+", () => {
  if (scaleLevel < MAX_LEVEL) {
    lineWidth *= RATIO;
    scaleLevel++;
    notify("scale-changed");
  }
});

bus.addEventListener("scale-changed", () => {
  currentLineWidthElement.innerHTML = `Width:${scaleLevel}`;
});

document.body.append(document.createElement("br"));

class ToolPreview {
  private _x: number;
  private _y: number;
  private _radius: number;

  constructor(x: number, y: number, radius: number) {
    this._x = x;
    this._y = y;
    this._radius = radius * (lineWidth / LINE_WIDTH);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    const c = 2;
    ctx.arc(this._x, this._y, this._radius, START_ANGLE, Math.PI * c);
    ctx.strokeStyle = lineStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

bus.addEventListener("tool-moved", () => {
  if (toolPreview) {
    ctx!.clearRect(ORIGIN.x, ORIGIN.y, canvas.width, canvas.height);
    commands.forEach((cmd) => cmd.execute());
    toolPreview.draw(ctx!);
  }
});

//copy from chatgpt
class EmojiSticker {
  private _x: number;
  private _y: number;
  private _emoji: string;

  constructor(x: number, y: number, emoji: string) {
    this._x = x;
    this._y = y;
    this._emoji = emoji;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.font = `${lineWidth}px sans-serif`;
    ctx.fillText(this._emoji, this._x, this._y);
  }

  set x(x: number) {
    this._x = x;
  }
  get x(): number {
    return this._x;
  }
  set y(y: number) {
    this._y = y;
  }
  get y(): number {
    return this._y;
  }
  set position(point: Point) {
    this._x = point.x;
    this._y = point.y;
  }
  get posion(): Point {
    return { x: this._x, y: this._y };
  }

  setPosition(x: number, y: number): void;
  setPosition(point: Point): void;
  setPosition(arg1: number | Point, arg2?: number): void {
    if (typeof arg1 === "number" && typeof arg2 === "number") {
      this._x = arg1;
      this._y = arg2;
    } else if (typeof arg1 === "object") {
      this._x = arg1.x;
      this._y = arg1.y;
    } else {
      throw new Error("Invalid arguments");
    }
  }
}

class StickerCommand {
  private _sticker: EmojiSticker;

  constructor(sticker: EmojiSticker) {
    this._sticker = sticker;
  }

  preview(x: number, y: number): void {
    this._sticker.setPosition(x, y);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this._sticker.draw(ctx);
  }
}

document.body.append(document.createElement("br"));
const emojiSticker1 = new EmojiSticker(ORIGIN.x, ORIGIN.y, "😃");
document.body.append(document.createElement("br"));
const emojiSticker2 = new EmojiSticker(ORIGIN.x, ORIGIN.y, "😔");
document.body.append(document.createElement("br"));
const emojiSticker3 = new EmojiSticker(ORIGIN.x, ORIGIN.y, "⭐");

const stickerCommands: StickerCommand[] | null = [];

const stickerButtons: Record<string, Button> = {
  happy: new Button("😃", () => {
    const stickerCommand = new StickerCommand(emojiSticker1);
    stickerCommands.push(stickerCommand);
    notify("tool-moved");
  }),
  sad: new Button("😔", () => {
    const stickerCommand = new StickerCommand(emojiSticker2);
    stickerCommands.push(stickerCommand);
    notify("tool-moved");
  }),
  star: new Button("⭐", () => {
    const stickerCommand = new StickerCommand(emojiSticker3);
    stickerCommands.push(stickerCommand);
    notify("tool-moved");
  }),
};

Object.values(stickerButtons).forEach((button) => {
  button.setOnClick(() => {
    if (stickerCommands.length) {
      const INDEX_OFFSET = -1;
      const stickerCommand =
        stickerCommands[stickerCommands.length + INDEX_OFFSET];
      stickerCommand.preview(HALF_SCALE, HALF_SCALE);
      notify("tool-moved");
    }
  });
});

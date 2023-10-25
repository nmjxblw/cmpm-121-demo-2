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
const ORIGIN: Point = { x: 0, y: 0 };

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
  constructor(x: number, y: number) {
    this.points = [{ x, y }];
  }
  execute() {
    ctx!.strokeStyle = "black";
    ctx!.lineWidth = LINE_WIDTH;
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
    ctx!.font = "32px monospace";
    ctx!.fillText("*", this.x + this.offset.x, this.y + this.offset.y);
  }
}

let currentLineCommand: LineCommand | null = null;

canvas.addEventListener("mouseout", () => {
  cursorCommand = null;
  notify("cursor-changed");
});

canvas.addEventListener("mouseenter", (e) => {
  cursorCommand = new CursorCommand(e.offsetX, e.offsetY);
  notify("cursor-changed");
});

canvas.addEventListener("mousemove", (e) => {
  cursorCommand = new CursorCommand(e.offsetX, e.offsetY);
  notify("cursor-changed");

  const LEFT_BUTTON_NUMBER = 1;
  if (e.buttons == LEFT_BUTTON_NUMBER) {
    currentLineCommand!.points.push({ x: e.offsetX, y: e.offsetY });
    notify("drawing-changed");
  }
});

canvas.addEventListener("mousedown", (e) => {
  currentLineCommand = new LineCommand(e.offsetX, e.offsetY);
  commands.push(currentLineCommand);
  redoCommands.splice(FIRST_INDEX, redoCommands.length);
  notify("drawing-changed");
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

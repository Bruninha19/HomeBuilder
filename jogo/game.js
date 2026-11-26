
"use strict";

/* ==========================================
   HOUSE BUILDER
   PARTE 1 - CONFIGURAÇÕES E SISTEMA BASE
========================================== */

/* ==========================================
   CONFIGURAÇÕES
========================================== */

const CONFIG = {
    width: 30,
    height: 20,
    tileSize: 24,
    autosave: true
};

const TILE_TYPES = {
    floor: {
        name: "Piso",
        color: "#a77a51",
        cost: 20,
        materials: 2,
        days: 1,
        layer: "floor"
    },

    wall: {
        name: "Parede",
        color: "#d5c9a9",
        cost: 100,
        materials: 5,
        days: 2,
        layer: "wall"
    },

    door: {
        name: "Porta",
        color: "#82502e",
        cost: 150,
        materials: 3,
        days: 1,
        layer: "object"
    },

    window: {
        name: "Janela",
        color: "#79bfe9",
        cost: 120,
        materials: 2,
        days: 1,
        layer: "object"
    },

    bedroom: {
        name: "Quarto",
        color: "#a7a1ce",
        cost: 80,
        materials: 2,
        days: 1,
        layer: "room"
    },

    bathroom: {
        name: "Banheiro",
        color: "#68aeb9",
        cost: 100,
        materials: 3,
        days: 1,
        layer: "room"
    },

    living: {
        name: "Sala",
        color: "#c5a56d",
        cost: 80,
        materials: 2,
        days: 1,
        layer: "room"
    },

    kitchen: {
        name: "Cozinha",
        color: "#d18c67",
        cost: 100,
        materials: 3,
        days: 1,
        layer: "room"
    },

    garage: {
        name: "Garagem",
        color: "#777f91",
        cost: 90,
        materials: 3,
        days: 1,
        layer: "room"
    },

    garden: {
        name: "Jardim",
        color: "#528e58",
        cost: 30,
        materials: 1,
        days: 1,
        layer: "decoration"
    }
};

const REQUIREMENTS = {
    bedroom: "Quartos",
    bathroom: "Banheiros",
    living: "Salas",
    kitchen: "Cozinhas",
    garage: "Garagens",
    window: "Janelas"
};


/* ==========================================
   ESTADO DO JOGO
========================================== */

let project = null;

let clientReviewProject = null;

let grid = createEmptyGrid();

let currentTool = "floor";

let currentRotation = 0;

let isDrawing = false;

let lastPaintedCell = null;

let selectedCell = null;

let construction = {
    money: 0,
    materials: 0,
    days: 0,
    built: [],
    selected: null
};


/* ==========================================
   REFERÊNCIAS DO CANVAS
========================================== */

const architectCanvas =
    document.getElementById("architect-canvas");

const builderCanvas =
    document.getElementById("builder-canvas");

const clientReviewCanvas =
    document.getElementById("client-review-canvas");

const architectContext =
    architectCanvas.getContext("2d");

const builderContext =
    builderCanvas.getContext("2d");

const clientReviewContext =
    clientReviewCanvas.getContext("2d");


/* ==========================================
   FUNÇÕES UTILITÁRIAS
========================================== */

function createEmptyGrid() {

    return Array.from(
        { length: CONFIG.height },
        () => Array(CONFIG.width).fill(null)
    );

}


function notify(message) {

    const toast = document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(notify.timer);

    notify.timer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}


function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"

    })[character]);

}


function saveLocal() {

    if (!CONFIG.autosave) return;

    try {

        localStorage.setItem(
            "houseBuilder_project",
            JSON.stringify(project)
        );

        localStorage.setItem(
            "houseBuilder_construction",
            JSON.stringify(construction)
        );

    } catch (error) {

        console.warn("Erro ao salvar:", error);

    }

}


function getTile(x, y) {

    if (
        x < 0 ||
        y < 0 ||
        x >= CONFIG.width ||
        y >= CONFIG.height
    ) {

        return null;

    }

    return grid[y][x];

}


function getCellPosition(event, canvas) {

    const rect = canvas.getBoundingClientRect();

    const x = Math.floor(
        (event.clientX - rect.left) *
        canvas.width / rect.width /
        CONFIG.tileSize
    );

    const y = Math.floor(
        (event.clientY - rect.top) *
        canvas.height / rect.height /
        CONFIG.tileSize
    );

    if (
        x < 0 ||
        y < 0 ||
        x >= CONFIG.width ||
        y >= CONFIG.height
    ) {

        return null;

    }

    return { x, y };

}


/* ==========================================
   NAVEGAÇÃO ENTRE AS TELAS
========================================== */

document.querySelectorAll(".nav-button").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".nav-button")
            .forEach(item => {

                item.classList.remove("active");

            });

        document.querySelectorAll(".screen")
            .forEach(screen => {

                screen.classList.add("hidden");

            });

        button.classList.add("active");

        const screen = document.getElementById(
            button.dataset.screen
        );

        screen.classList.remove("hidden");

        renderAll();

    });

});


/* ==========================================
   CRIAÇÃO DO PROJETO PELO CLIENTE
========================================== */

function createProject() {

    const getValue = id => {

        const value = Number(
            document.getElementById(id).value
        );

        return Math.max(0, value || 0);

    };

    const name = document
        .getElementById("project-name")
        .value.trim();

    project = {

        version: 1,

        game: "House Builder",

        project: {

            id: "HB-" + Date.now(),

            name: name || "Nova Casa",

            status: "requirements",

            createdAt: new Date().toISOString()

        },

        client: {

            budget: getValue("project-budget"),

            deadline: getValue("project-deadline"),

            style: document.getElementById(
                "project-style"
            ).value,

            requirements: {

                bedroom: getValue("req-bedroom"),

                bathroom: getValue("req-bathroom"),

                living: getValue("req-living"),

                kitchen: getValue("req-kitchen"),

                garage: getValue("req-garage"),

                window: getValue("req-window")

            },

            notes: document.getElementById(
                "project-notes"
            ).value

        },

        floorPlan: null,

        construction: null

    };

    grid = createEmptyGrid();

    construction = {

        money: project.client.budget,

        materials: Math.max(
            20,
            Math.floor(project.client.budget / 100)
        ),

        days: 0,

        built: [],

        selected: null

    };

    saveLocal();

    updateBrief();

    updateValidation();

    exportProject();

    notify("Briefing criado com sucesso!");

}


/* ==========================================
   GERAR CLIENTE ALEATÓRIO
========================================== */

function randomInteger(minimum, maximum) {

    return Math.floor(
        Math.random() * (maximum - minimum + 1)
    ) + minimum;

}


function generateRandomClient() {

    const names = [
        "Residência Moderna",
        "Casa da Família",
        "Refúgio de Férias",
        "Casa dos Sonhos",
        "Lar Contemporâneo",
        "Vila Familiar",
        "Sobrado Aurora",
        "Casa Horizonte"
    ];

    const styles = [
        "modern",
        "classic",
        "rustic",
        "industrial",
        "minimalist"
    ];

    const notes = [
        "A casa deve ter ambientes claros e bem ventilados.",
        "Priorizar um espaço externo agradável para a família.",
        "Gostamos de ambientes confortáveis e com boa iluminação.",
        "Queremos uma casa prática, moderna e econômica.",
        "A residência deve ter espaço para receber visitas.",
        "Preferimos ambientes integrados e bem distribuídos.",
        "Sem observações adicionais."
    ];

    document.getElementById("project-name").value =
        names[randomInteger(0, names.length - 1)];

    document.getElementById("project-budget").value =
        randomInteger(35, 120) * 1000;

    document.getElementById("project-deadline").value =
        randomInteger(20, 75);

    document.getElementById("project-style").value =
        styles[randomInteger(0, styles.length - 1)];

    document.getElementById("req-bedroom").value =
        randomInteger(1, 5);

    document.getElementById("req-bathroom").value =
        randomInteger(1, 3);

    document.getElementById("req-living").value =
        randomInteger(1, 2);

    document.getElementById("req-kitchen").value =
        randomInteger(1, 2);

    document.getElementById("req-garage").value =
        randomInteger(0, 2);

    document.getElementById("req-window").value =
        randomInteger(4, 12);

    document.getElementById("project-notes").value =
        notes[randomInteger(0, notes.length - 1)];

    notify("Novo cliente gerado!");

}


/* ==========================================
   EXPORTAÇÃO JSON
========================================== */


function exportProject() {

    if (!project) {
        alert("Nenhum projeto para exportar!");
        return;
    }

    downloadProjectData(project);

}


function downloadProjectData(data, suffix = "") {

    try {

        const json = JSON.stringify(data, null, 2);

        const blob = new Blob(
            [json],
            { type: "application/json;charset=utf-8" }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download = (
            data.project?.name || "house-builder"
        ).replace(/[^a-z0-9_-]/gi, "_") + suffix + ".json";

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);

        notify("Arquivo JSON exportado com sucesso!");

    } catch (error) {

        console.error("Erro ao exportar:", error);

        alert("Erro ao exportar JSON: " + error.message);

    }

}



/* ==========================================
   IMPORTAÇÃO JSON
========================================== */

function importProject(event) {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {

        try {

            const data = JSON.parse(reader.result);

            if (
                data.game !== "House Builder" ||
                !data.project ||
                !data.client
            ) {

                throw new Error(
                    "Arquivo JSON inválido."
                );

            }

            if (
                data.floorPlan &&
                (
                    data.floorPlan.width !== CONFIG.width ||
                    data.floorPlan.height !== CONFIG.height ||
                    !Array.isArray(data.floorPlan.grid)
                )
            ) {

                throw new Error(
                    "Dimensões da planta incompatíveis."
                );

            }

            project = data;

            if (project.floorPlan) {

                grid = project.floorPlan.grid;

            } else {

                grid = createEmptyGrid();

            }

            if (project.construction) {

                construction = project.construction;

            } else {

                construction = {

                    money: project.client.budget,

                    materials: Math.max(
                        20,
                        Math.floor(project.client.budget / 100)
                    ),

                    days: 0,

                    built: [],

                    selected: null

                };

            }

            if (!Array.isArray(construction.built)) {

                construction.built = [];

            }

            updateBrief();

            updateValidation();

            updateConstructionUI();

            renderAll();

            saveLocal();

            notify("Projeto importado!");

        } catch (error) {

            alert(
                "Erro ao importar JSON: " + error.message
            );

        }

    };

    reader.readAsText(file);

    event.target.value = "";

}


/* ==========================================
   ATUALIZAÇÃO DO BRIEFING
========================================== */

function updateBrief() {

    const element = document.getElementById("brief-info");

    if (!project) {

        element.textContent = "Nenhum projeto carregado.";

        return;

    }

    const requirements =
        project.client.requirements || {};

    element.innerHTML = `

        <strong>
            ${escapeHTML(project.project.name)}
        </strong>

        <br>

        Estilo:
        ${escapeHTML(project.client.style)}

        <br>

        Orçamento:
        $${project.client.budget}

        <br>

        Prazo:
        ${project.client.deadline} dias

        <hr>

        ${Object.entries(REQUIREMENTS).map(([key, label]) => `

            ${label}: ${requirements[key] || 0}

            <br>

        `).join("")}

        <hr>

        ${escapeHTML(
            project.client.notes || "Sem observações."
        )}

    `;

}


/* ==========================================
   HOUSE BUILDER
   PARTE 2 - EDITOR DE PLANTA
========================================== */


/* ==========================================
   SELEÇÃO DE FERRAMENTAS
========================================== */

document.querySelectorAll(".tool-button").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".tool-button")
            .forEach(item => {
                item.classList.remove("active");
            });

        button.classList.add("active");

        currentTool = button.dataset.tool;

    });

});


/* ==========================================
   ROTAÇÃO DAS FERRAMENTAS
========================================== */

document.getElementById("rotate-tool")
    .addEventListener("click", () => {

        currentRotation = (currentRotation + 90) % 360;

        notify("Rotação: " + currentRotation + "°");

    });


/* ==========================================
   PINTAR TILE
========================================== */

function paintCell(event) {

    const position = getCellPosition(
        event,
        architectCanvas
    );

    if (!position) return;

    const { x, y } = position;

    const key = `${x},${y}`;

    // Evita pintar a mesma célula repetidamente
    if (lastPaintedCell === key) return;

    lastPaintedCell = key;

    if (currentTool === "erase") {

        grid[y][x] = null;

    } else {

        const isRoom = [
            "bedroom",
            "bathroom",
            "living",
            "kitchen",
            "garage"
        ].includes(currentTool);

        grid[y][x] = {

            type: currentTool,

            rotation: currentRotation,

            roomId: isRoom
                ? `${currentTool}-${x}-${y}`
                : null

        };

    }

    renderArchitect();

    updateValidation();

}


/* ==========================================
   CONTROLES DO CANVAS
========================================== */

// Começar a desenhar
architectCanvas.addEventListener("pointerdown", event => {

    isDrawing = true;

    lastPaintedCell = null;

    architectCanvas.setPointerCapture(event.pointerId);

    paintCell(event);

});


// Arrastar para desenhar
architectCanvas.addEventListener("pointermove", event => {

    if (!isDrawing) return;

    paintCell(event);

});


// Parar de desenhar
architectCanvas.addEventListener("pointerup", () => {

    isDrawing = false;

    lastPaintedCell = null;

});

architectCanvas.addEventListener("pointercancel", () => {

    isDrawing = false;

    lastPaintedCell = null;

});


// Botão direito apaga tiles
architectCanvas.addEventListener("contextmenu", event => {

    event.preventDefault();

    const position = getCellPosition(
        event,
        architectCanvas
    );

    if (!position) return;

    grid[position.y][position.x] = null;

    renderArchitect();

    updateValidation();

});


/* ==========================================
   LIMPAR PLANTA
========================================== */

document.getElementById("clear-plan")
    .addEventListener("click", () => {

        if (!confirm("Deseja apagar toda a planta?")) {
            return;
        }

        grid = createEmptyGrid();

        renderArchitect();

        updateValidation();

        notify("Planta limpa.");

    });


/* ==========================================
   RENDERIZAÇÃO DO CANVAS
========================================== */

function drawGrid(
    context,
    showConstruction = false,
    sourceGrid = grid,
    sourceConstruction = construction
) {

    const tileSize = CONFIG.tileSize;

    const canvas = context.canvas;

    context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    context.fillStyle = "#182230";

    context.fillRect(
        0,
        0,
        CONFIG.width * tileSize,
        CONFIG.height * tileSize
    );


    for (let y = 0; y < CONFIG.height; y++) {

        for (let x = 0; x < CONFIG.width; x++) {

            const cell = sourceGrid[y][x];

            const px = x * tileSize;

            const py = y * tileSize;


            // Desenhar tile
            if (cell) {

                const type = TILE_TYPES[cell.type];

                if (type) {

                    context.fillStyle = type.color;

                    context.fillRect(
                        px + 1,
                        py + 1,
                        tileSize - 2,
                        tileSize - 2
                    );


                    // Símbolos dos elementos
                    const symbols = {

                        floor: "",

                        wall: "▦",

                        door: "D",

                        window: "═",

                        bedroom: "B",

                        bathroom: "W",

                        living: "L",

                        kitchen: "K",

                        garage: "G",

                        garden: "♣"

                    };


                    context.save();

                    context.translate(
                        px + tileSize / 2,
                        py + tileSize / 2
                    );

                    context.rotate(
                        (cell.rotation || 0) * Math.PI / 180
                    );

                    context.fillStyle = "#17202c";

                    context.font = "14px monospace";

                    context.textAlign = "center";

                    context.textBaseline = "middle";

                    context.fillText(
                        symbols[cell.type] || "",
                        0,
                        0
                    );

                    context.restore();

                }


                // Visualização do progresso da construção
                if (showConstruction) {

                    const index =
                        y * CONFIG.width + x;

                    if (sourceConstruction.built.includes(index)) {

                        context.fillStyle =
                            "rgba(100,230,130,.35)";

                        context.fillRect(
                            px + 1,
                            py + 1,
                            tileSize - 2,
                            tileSize - 2
                        );

                        context.fillStyle = "#d4ffdc";

                        context.font = "14px monospace";

                        context.textAlign = "center";

                        context.textBaseline = "middle";

                        context.fillText(
                            "✓",
                            px + tileSize / 2,
                            py + tileSize / 2
                        );

                    } else {

                        context.fillStyle =
                            "rgba(0,0,0,.25)";

                        context.fillRect(
                            px + 1,
                            py + 1,
                            tileSize - 2,
                            tileSize - 2
                        );

                    }

                }

            }


            // Grade
            context.strokeStyle = "#344255";

            context.lineWidth = 0.6;

            context.strokeRect(
                px,
                py,
                tileSize,
                tileSize
            );

        }

    }


    // Célula selecionada
    if (selectedCell && !showConstruction) {

        context.strokeStyle = "#ffff88";

        context.lineWidth = 2;

        context.strokeRect(
            selectedCell.x * tileSize + 1,
            selectedCell.y * tileSize + 1,
            tileSize - 2,
            tileSize - 2
        );

    }

}


/* ==========================================
   RENDERIZAR ARQUITETO
========================================== */

function renderArchitect() {

    drawGrid(architectContext);

}


/* ==========================================
   RENDERIZAR CONSTRUTOR
========================================== */

function renderBuilder() {

    if (!project) return;

    drawGrid(builderContext, true);

}


/* ==========================================
   RENDERIZAR TODAS AS TELAS
========================================== */

function renderAll() {

    renderArchitect();

    renderBuilder();

}


/* ==========================================
   SALVAR PLANTA
========================================== */

document.getElementById("save-plan")
    .addEventListener("click", () => {

        if (!project) {

            notify(
                "Importe ou crie um briefing primeiro."
            );

            return;

        }


        const rooms = {};

        const layers = {

            floor: [],

            walls: [],

            objects: [],

            areas: []

        };


        // Percorrer toda a matriz
        grid.forEach((row, y) => {

            row.forEach((cell, x) => {

                if (!cell) return;


                const item = {

                    x,

                    y,

                    type: cell.type,

                    rotation: cell.rotation || 0

                };


                const layer =
                    TILE_TYPES[cell.type]?.layer;


                if (layer === "floor") {

                    layers.floor.push(item);

                }

                else if (layer === "wall") {

                    layers.walls.push(item);

                }

                else if (layer === "object") {

                    layers.objects.push(item);

                }

                else {

                    layers.areas.push(item);

                }


                // Registrar cômodos
                if (cell.roomId) {

                    if (!rooms[cell.roomId]) {

                        rooms[cell.roomId] = {

                            id: cell.roomId,

                            type: cell.type,

                            tiles: []

                        };

                    }

                    rooms[cell.roomId].tiles.push([x, y]);

                }

            });

        });


        // Estrutura da planta no JSON
        project.floorPlan = {

            width: CONFIG.width,

            height: CONFIG.height,

            tileSize: CONFIG.tileSize,

            grid: grid,

            layers: layers,

            rooms: Object.values(rooms),

            completedAt: new Date().toISOString()

        };


        project.project.status = "designed";


        saveLocal();

        updateValidation();

        renderAll();

        exportProject();

        notify("Planta concluída!");

    });


/* ==========================================
   CONTAR TILES
========================================== */

function countTiles(type, sourceGrid = grid) {

    return sourceGrid.flat().filter(cell => {

        return cell?.type === type;

    }).length;

}


/* ==========================================
   CONTAR CÔMODOS
========================================== */

function countRooms(type, sourceGrid = grid) {

    const visited = Array.from(
        { length: sourceGrid.length },
        () => Array(sourceGrid[0].length).fill(false)
    );

    let roomCount = 0;

    for (let y = 0; y < sourceGrid.length; y++) {

        for (let x = 0; x < sourceGrid[y].length; x++) {

            if (
                visited[y][x] ||
                sourceGrid[y][x]?.type !== type
            ) {

                continue;

            }

            roomCount++;

            const cells = [{ x, y }];

            visited[y][x] = true;

            while (cells.length > 0) {

                const cell = cells.pop();

                const neighbors = [
                    { x: cell.x + 1, y: cell.y },
                    { x: cell.x - 1, y: cell.y },
                    { x: cell.x, y: cell.y + 1 },
                    { x: cell.x, y: cell.y - 1 }
                ];

                neighbors.forEach(neighbor => {

                    if (
                        neighbor.x < 0 ||
                        neighbor.y < 0 ||
                        neighbor.y >= sourceGrid.length ||
                        neighbor.x >= sourceGrid[neighbor.y].length ||
                        visited[neighbor.y][neighbor.x] ||
                        sourceGrid[neighbor.y][neighbor.x]?.type !== type
                    ) {

                        return;

                    }

                    visited[neighbor.y][neighbor.x] = true;

                    cells.push(neighbor);

                });

            }

        }

    }

    return roomCount;

}


/* ==========================================
   VALIDAR EXIGÊNCIAS DO CLIENTE
========================================== */

function updateValidation() {

    const element = document.getElementById(
        "validation-results"
    );

    if (!project) {

        element.textContent = "Importe um briefing.";

        return;

    }


    const requirements =
        project.client.requirements || {};


    let completed = 0;

    const total = Object.keys(REQUIREMENTS).length;

    let html = "";


    Object.entries(REQUIREMENTS).forEach(([key, label]) => {

        const actual = key === "window"
            ? countTiles(key)
            : countRooms(key);

        const required = requirements[key] || 0;

        const valid = actual >= required;

        if (valid) completed++;


        html += `

            <div class="requirement">

                <span>${label}</span>

                <span class="${valid ? "good" : "bad"}">

                    ${actual}/${required}

                    ${valid ? "✓" : "✗"}

                </span>

            </div>

        `;

    });


    const percentage = Math.round(
        completed / total * 100
    );


    element.innerHTML = `

        ${html}

        <hr>

        <strong>
            ${percentage}% dos requisitos atendidos
        </strong>

    `;

}


/* ==========================================
   FIM DA PARTE 2
========================================== */


/* ==========================================
   HOUSE BUILDER
   PARTE 3 - SISTEMA DE CONSTRUÇÃO
========================================== */


/* ==========================================
   SELEÇÃO DE ELEMENTOS NO CONSTRUTOR
========================================== */

builderCanvas.addEventListener("click", event => {

    if (!project?.floorPlan) {

        notify("Nenhuma planta carregada.");

        return;

    }

    const position = getCellPosition(
        event,
        builderCanvas
    );

    if (!position) return;

    const cell = getTile(
        position.x,
        position.y
    );

    if (!cell) {

        selectedCell = null;

        construction.selected = null;

        renderBuilder();

        return;

    }

    selectedCell = position;

    construction.selected =
        position.y * CONFIG.width + position.x;

    renderBuilder();

    const type = TILE_TYPES[cell.type];

    notify(
        "Selecionado: " + (type?.name || cell.type)
    );

});


/* ==========================================
   CONSTRUIR UM ELEMENTO
========================================== */

function buildElement(index) {

    if (construction.built.includes(index)) {

        notify("Esse elemento já foi construído.");

        return false;

    }

    const x = index % CONFIG.width;

    const y = Math.floor(index / CONFIG.width);

    const cell = getTile(x, y);

    if (!cell) return false;

    const type = TILE_TYPES[cell.type];

    if (!type) return false;


    // Verificar dinheiro
    if (construction.money < type.cost) {

        notify("Dinheiro insuficiente!");

        return false;

    }


    // Verificar materiais
    if (construction.materials < type.materials) {

        notify("Materiais insuficientes!");

        return false;

    }


    // Consumir recursos
    construction.money -= type.cost;

    construction.materials -= type.materials;

    construction.days += type.days;


    // Registrar construção
    construction.built.push(index);


    saveLocal();

    updateConstructionUI();

    return true;

}


/* ==========================================
   CONSTRUIR ELEMENTO SELECIONADO
========================================== */

document.getElementById("build-selected")
    .addEventListener("click", () => {

        const index = construction.selected;

        if (
            index === null ||
            index === undefined
        ) {

            notify("Selecione um elemento primeiro.");

            return;

        }

        if (buildElement(index)) {

            renderBuilder();

            notify("Elemento construído!");

        }

    });


/* ==========================================
   CONSTRUIR CASA COMPLETA
========================================== */

document.getElementById("build-all")
    .addEventListener("click", () => {

        if (!project?.floorPlan) {

            notify("Importe uma planta primeiro.");

            return;

        }

        let completed = 0;

        for (let y = 0; y < CONFIG.height; y++) {

            for (let x = 0; x < CONFIG.width; x++) {

                if (!grid[y][x]) continue;

                const index =
                    y * CONFIG.width + x;

                if (buildElement(index)) {

                    completed++;

                } else {

                    renderBuilder();

                    updateConstructionUI();

                    notify(
                        completed +
                        " elementos construídos. Recursos insuficientes."
                    );

                    return;

                }

            }

        }

        renderBuilder();

        updateConstructionUI();

        notify("Construção finalizada!");

    });


/* ==========================================
   ATUALIZAR INTERFACE DA CONSTRUÇÃO
========================================== */

function updateConstructionUI() {

    if (!project) return;


    // Total de elementos da planta
    const total = grid.flat().filter(Boolean).length;

    const completed = construction.built.length;

    const percentage = total
        ? Math.round(completed / total * 100)
        : 0;


    // Recursos
    document.getElementById("resource-money")
        .textContent = "$" + construction.money;

    document.getElementById("resource-materials")
        .textContent = construction.materials;

    document.getElementById("resource-days")
        .textContent = construction.days;


    // Barra de progresso
    document.getElementById("construction-progress")
        .style.width = percentage + "%";

    document.getElementById("progress-label")
        .textContent =
            percentage + "% concluído (" +
            completed + "/" + total + ")";


    // Informações do projeto
    const deadline = project.client.deadline;

    document.getElementById("construction-info")
        .innerHTML = `

            <strong>
                ${escapeHTML(project.project.name)}
            </strong>

            <br>

            Prazo: ${deadline} dias

            <br>

            ${

                construction.days > deadline

                    ? '<span class="bad">Prazo ultrapassado!</span>'

                    : '<span class="good">Dentro do prazo</span>'

            }

        `;


    // Mensagem de conclusão
    const message = document.getElementById(
        "construction-message"
    );

    if (total > 0 && completed >= total) {

        project.project.status = "built";

        project.construction = {

            ...construction,

            completedAt: new Date().toISOString()

        };

        message.innerHTML = `

            <h3 class="good">
                🏆 CONSTRUÇÃO FINALIZADA!
            </h3>

            Todos os elementos foram construídos.

        `;

    } else {

        message.textContent =
            "Selecione um elemento para construir.";

    }


    saveLocal();

}


/* ==========================================
   EXPORTAR RESULTADO DA CONSTRUÇÃO
========================================== */

document.getElementById("export-construction")
    .addEventListener("click", () => {

        if (!project?.floorPlan) {

            notify("Importe uma planta antes de enviar a obra.");

            return;

        }

        const total = grid.flat().filter(Boolean).length;

        const built = new Set(construction.built);

        if (
            total === 0 ||
            built.size < total ||
            grid.some((row, y) => row.some((cell, x) => (
                cell &&
                !built.has(y * CONFIG.width + x)
            )))
        ) {

            notify("Conclua todos os elementos antes de enviar ao cliente.");

            return;

        }

        project.construction = {

            ...construction,

            completedAt: new Date().toISOString()

        };

        project.project.status = "awaiting-client-review";

        saveLocal();

        exportProject();

        notify("Obra concluída e enviada para validação!");

    });


/* ==========================================
   VALIDAÇÃO FINAL PELO CLIENTE
========================================== */

function getClientReviewResults(reviewProject) {

    const reviewGrid = reviewProject.floorPlan.grid;

    const requirements =
        reviewProject.client.requirements || {};

    const results = Object.entries(REQUIREMENTS).map(([key, label]) => {

        const actual = key === "window"
            ? countTiles(key, reviewGrid)
            : countRooms(key, reviewGrid);

        const required = Number(requirements[key]) || 0;

        return {
            label,
            actual,
            required,
            valid: actual >= required
        };

    });

    const built = new Set(reviewProject.construction.built);

    let totalTiles = 0;

    let completedTiles = 0;

    reviewGrid.forEach((row, y) => {

        row.forEach((cell, x) => {

            if (!cell) return;

            totalTiles++;

            if (built.has(y * CONFIG.width + x)) {

                completedTiles++;

            }

        });

    });

    const budget = Number(reviewProject.client.budget);

    const remainingMoney =
        Number(reviewProject.construction.money);

    const days = Number(reviewProject.construction.days);

    const deadline = Number(reviewProject.client.deadline);

    const completed = totalTiles > 0 &&
        completedTiles === totalTiles;

    const withinBudget = Number.isFinite(budget) &&
        Number.isFinite(remainingMoney) &&
        remainingMoney >= 0 &&
        remainingMoney <= budget;

    const withinDeadline = Number.isFinite(days) &&
        Number.isFinite(deadline) &&
        days <= deadline;

    const requirementsMet = results.every(result => result.valid);

    return {
        results,
        totalTiles,
        completedTiles,
        completed,
        withinBudget,
        withinDeadline,
        requirementsMet,
        approved: completed &&
            withinBudget &&
            withinDeadline &&
            requirementsMet
    };

}


function renderClientReview() {

    if (!clientReviewProject) return;

    const results = getClientReviewResults(clientReviewProject);

    document.getElementById("client-review-content")
        .classList.remove("hidden");

    document.getElementById("client-review-project-name")
        .textContent = clientReviewProject.project.name;

    document.getElementById("client-review-info")
        .textContent =
            "Obra recebida: " +
            clientReviewProject.project.name +
            ". Confira os itens e registre sua decisão abaixo.";

    const rows = results.results.map(result => `

        <div class="requirement">
            <span>${result.label}</span>
            <span class="${result.valid ? "good" : "bad"}">
                ${result.actual}/${result.required}
                ${result.valid ? "✓" : "✗"}
            </span>
        </div>

    `).join("");

    const constructionRows = `
        <div class="requirement">
            <span>Obra concluída</span>
            <span class="${results.completed ? "good" : "bad"}">
                ${results.completedTiles}/${results.totalTiles}
                ${results.completed ? "✓" : "✗"}
            </span>
        </div>
        <div class="requirement">
            <span>Orçamento</span>
            <span class="${results.withinBudget ? "good" : "bad"}">
                $${clientReviewProject.construction.money}/$${clientReviewProject.client.budget}
                ${results.withinBudget ? "✓" : "✗"}
            </span>
        </div>
        <div class="requirement">
            <span>Prazo</span>
            <span class="${results.withinDeadline ? "good" : "bad"}">
                ${clientReviewProject.construction.days}/${clientReviewProject.client.deadline} dias
                ${results.withinDeadline ? "✓" : "✗"}
            </span>
        </div>
    `;

    document.getElementById("client-review-results")
        .innerHTML = `
            <h3>Requisitos do cliente</h3>
            ${rows}
            <hr>
            ${constructionRows}
        `;

    document.getElementById("client-review-brief")
        .innerHTML = `
            <strong>Briefing:</strong>
            ${escapeHTML(clientReviewProject.client.notes || "Sem observações.")}
        `;

    drawGrid(
        clientReviewContext,
        true,
        clientReviewProject.floorPlan.grid,
        clientReviewProject.construction
    );

    const approveButton = document.getElementById(
        "approve-construction"
    );

    const requestChangesButton = document.getElementById(
        "request-construction-changes"
    );

    const exportReviewButton = document.getElementById(
        "export-client-review"
    );

    approveButton.disabled = !results.approved;

    requestChangesButton.disabled = false;

    const existingReview = clientReviewProject.clientReview;

    if (existingReview) {

        document.getElementById("client-review-status")
            .textContent = existingReview.status === "approved"
                ? "Esta obra já foi aprovada pelo cliente."
                : "O cliente solicitou ajustes nesta obra.";

        document.getElementById("client-review-notes")
            .value = existingReview.notes || "";

        exportReviewButton.classList.remove("hidden");

    } else {

        document.getElementById("client-review-status")
            .textContent = results.approved
                ? "Todos os critérios foram atendidos. Você pode aprovar a obra."
                : "Há critérios pendentes. A obra não pode ser aprovada, mas você pode solicitar ajustes.";

        exportReviewButton.classList.add("hidden");

    }

}


function importClientReview(event) {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {

        try {

            const data = JSON.parse(reader.result);

            if (
                data.game !== "House Builder" ||
                !data.project ||
                !data.client ||
                !data.floorPlan ||
                !data.construction ||
                !Array.isArray(data.construction.built)
            ) {

                throw new Error(
                    "Este arquivo não contém uma construção para validar."
                );

            }

            const reviewGrid = data.floorPlan.grid;

            if (
                data.floorPlan.width !== CONFIG.width ||
                data.floorPlan.height !== CONFIG.height ||
                !Array.isArray(reviewGrid) ||
                reviewGrid.length !== CONFIG.height ||
                reviewGrid.some(row => (
                    !Array.isArray(row) ||
                    row.length !== CONFIG.width
                ))
            ) {

                throw new Error(
                    "A planta possui dimensões incompatíveis."
                );

            }

            reviewGrid.forEach(row => row.forEach(cell => {

                if (
                    cell !== null &&
                    (
                        typeof cell !== "object" ||
                        !TILE_TYPES[cell.type]
                    )
                ) {

                    throw new Error(
                        "A planta contém elementos inválidos."
                    );

                }

            }));

            if (
                !data.client.requirements ||
                Object.keys(REQUIREMENTS).some(key => {

                    const requirement =
                        data.client.requirements[key];

                    return requirement !== undefined && (
                        !Number.isFinite(Number(requirement)) ||
                        Number(requirement) < 0
                    );

                }) ||
                !Number.isFinite(Number(data.client.budget)) ||
                Number(data.client.budget) < 0 ||
                !Number.isFinite(Number(data.client.deadline)) ||
                Number(data.client.deadline) < 0 ||
                !Number.isFinite(Number(data.construction.money)) ||
                Number(data.construction.money) < 0 ||
                !Number.isFinite(Number(data.construction.days)) ||
                Number(data.construction.days) < 0 ||
                data.construction.built.some(index => (
                    !Number.isInteger(index) ||
                    index < 0 ||
                    index >= CONFIG.width * CONFIG.height
                ))
            ) {

                throw new Error(
                    "O briefing ou o progresso da construção está inválido."
                );

            }

            clientReviewProject = data;

            renderClientReview();

            notify("Obra carregada para validação.");

        } catch (error) {

            alert("Erro ao validar arquivo: " + error.message);

        }

    };

    reader.readAsText(file);

    event.target.value = "";

}


function saveClientReview(status) {

    if (!clientReviewProject) {

        notify("Importe uma obra antes de registrar a validação.");

        return;

    }

    const results = getClientReviewResults(clientReviewProject);

    if (status === "approved" && !results.approved) {

        notify("A obra não atende a todos os critérios para aprovação.");

        return;

    }

    const notes = document.getElementById(
        "client-review-notes"
    ).value.trim();

    clientReviewProject.clientReview = {

        status,

        reviewedAt: new Date().toISOString(),

        notes: notes || (
            status === "approved"
                ? "Obra aprovada pelo cliente."
                : "A obra precisa de ajustes."
        )

    };

    clientReviewProject.project.status =
        status === "approved"
            ? "client-approved"
            : "adjustments-requested";

    renderClientReview();

    notify(
        status === "approved"
            ? "Obra aprovada."
            : "Ajustes solicitados."
    );

}


document.getElementById("client-review-import")
    .addEventListener("change", importClientReview);

document.getElementById("approve-construction")
    .addEventListener("click", () => {

        saveClientReview("approved");

    });

document.getElementById("request-construction-changes")
    .addEventListener("click", () => {

        saveClientReview("adjustments-requested");

    });

document.getElementById("export-client-review")
    .addEventListener("click", () => {

        if (!clientReviewProject?.clientReview) {

            notify("Registre uma decisão antes de exportar.");

            return;

        }

        downloadProjectData(
            clientReviewProject,
            "_resposta-cliente"
        );

    });


/* ==========================================
   IMPORTAÇÃO NAS DUAS TELAS
========================================== */

document.getElementById("architect-import")
    .addEventListener("change", importProject);

document.getElementById("builder-import")
    .addEventListener("change", importProject);


/* ==========================================
   RESTAURAR PROGRESSO LOCAL
========================================== */

function restoreLocal() {

    try {

        const savedProject =
            localStorage.getItem("houseBuilder_project");

        const savedConstruction =
            localStorage.getItem("houseBuilder_construction");


        if (!savedProject) return;


        project = JSON.parse(savedProject);


        // Restaurar planta
        if (project.floorPlan?.grid) {

            grid = project.floorPlan.grid;

        } else {

            grid = createEmptyGrid();

        }


        // Restaurar construção
        if (savedConstruction) {

            construction = JSON.parse(savedConstruction);

        }


        if (!Array.isArray(construction.built)) {

            construction.built = [];

        }


        updateBrief();

        updateValidation();

        updateConstructionUI();

    } catch (error) {

        console.warn(
            "Erro ao restaurar projeto:",
            error
        );

    }

}


/* ==========================================
   INICIALIZAÇÃO DO JOGO
========================================== */

function initializeGame() {

    generateRandomClient();

    // Restaurar dados salvos
    restoreLocal();

    // Renderizar os dois canvases
    renderAll();

    // Atualizar interface
    updateBrief();

    updateValidation();

    if (project) {

        updateConstructionUI();

    }

    console.log(
        "🏠 HOUSE BUILDER carregado com sucesso!"
    );

}


/* ==========================================
   INICIAR
========================================== */

initializeGame();


/* ==========================================
   FIM DO HOUSE BUILDER
========================================== */


/* ==========================================
   CONTROLE DOS BOTÕES DO CLIENTE
========================================== */

document.getElementById("random-client")
    .addEventListener("click", generateRandomClient);

document.getElementById("export-json")
    .addEventListener("click", createProject);
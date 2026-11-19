
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

const architectContext =
    architectCanvas.getContext("2d");

const builderContext =
    builderCanvas.getContext("2d");


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
   EXPORTAÇÃO JSON
========================================== */


function exportProject() {

    if (!project) {
        alert("Nenhum projeto para exportar!");
        return;
    }

    try {

        // Gerar JSON completo
        const json = JSON.stringify(project, null, 2);

        // Criar arquivo
        const blob = new Blob(
            [json],
            { type: "application/json;charset=utf-8" }
        );

        // Criar URL temporária
        const url = URL.createObjectURL(blob);

        // Criar link de download
        const link = document.createElement("a");

        link.href = url;

        link.download = (
            project.project?.name || "house-builder"
        ).replace(/[^a-z0-9_-]/gi, "_") + ".json";

        // Adicionar ao documento
        document.body.appendChild(link);

        // Disparar download
        link.click();

        // Remover link
        document.body.removeChild(link);

        // Liberar URL depois do download
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);

        console.log("JSON exportado:", json);

        notify("JSON exportado com sucesso!");

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

function drawGrid(context, showConstruction = false) {

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

            const cell = grid[y][x];

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

                    if (construction.built.includes(index)) {

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

function countTiles(type) {

    return grid.flat().filter(cell => {

        return cell?.type === type;

    }).length;

}


/* ==========================================
   CONTAR CÔMODOS
========================================== */

function countRooms(type) {

    const rooms = new Set();

    grid.flat().forEach(cell => {

        if (
            cell?.type === type &&
            cell.roomId
        ) {

            rooms.add(cell.roomId);

        }

    });

    return rooms.size;

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

            notify("Nenhuma planta carregada.");

            return;

        }

        project.construction = {

            ...construction,

            completedAt:

                construction.built.length ===
                grid.flat().filter(Boolean).length

                    ? new Date().toISOString()

                    : null

        };


        project.project.status =

            project.construction.completedAt

                ? "built"

                : "construction-in-progress";


        saveLocal();

        exportProject();

        notify("Resultado exportado!");

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
   BOTÃO EXPORTAR JSON
========================================== */

const exportButton = document.getElementById("export-json");

if (exportButton) {
    exportButton.addEventListener("click", exportProject);
} else {
    console.error("Não encontrei o botão #export-json no HTML.");
}



    document.addEventListener("DOMContentLoaded", () => {

        const exportButton = document.getElementById("export-json");
    
        if (exportButton) {
    
            exportButton.addEventListener("click", exportProject);
    
        } else {
    
            console.error("Botão export-json não encontrado!");
    
        }
    
    });
    document.getElementById("export-json")
    .addEventListener("click", () => {
        createProject();
    });
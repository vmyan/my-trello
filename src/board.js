import Card from "./card";

export default class Board {
  constructor(container) {
    this.container = container;
    this.columns = ["To Do", "In Progress", "Done"];
    this.state =
      JSON.parse(localStorage.getItem("boardState")) || this.initState();
    this.render();
    this.addEventListeners();
    this.addDnDEvents();
  }

  initState() {
    const state = {};
    this.columns.forEach((col) => (state[col] = []));
    return state;
  }

  render() {
    this.container.innerHTML = "";
    this.columns.forEach((colName) => {
      const col = document.createElement("div");
      col.className = "column";
      col.dataset.name = colName;
      col.innerHTML = `<h3>${colName}</h3><button class="add-card">Add another card</button>`;

      const colCards = document.createElement("div");
      colCards.className = "cards-container";

      this.state[colName].forEach((cardData) => {
        const card = new Card(cardData.text, cardData.id);
        colCards.appendChild(card.element);
      });

      col.appendChild(colCards);
      this.container.appendChild(col);
    });
  }

  addEventListeners() {
    this.container.addEventListener("click", (e) => {
      if (e.target.classList.contains("add-card")) {
        const col = e.target.closest(".column");

        if (col.querySelector(".new-card-input")) return;

        const inputWrapper = document.createElement("div");
        inputWrapper.className = "new-card-wrapper";
        inputWrapper.innerHTML = `
          <input type="text" class="new-card-input" placeholder="Enter card text" />
          <button class="save-card">Save</button>
          <button class="cancel-card">Cancel</button>
        `;
        col.appendChild(inputWrapper);

        const input = inputWrapper.querySelector(".new-card-input");
        input.focus();

        inputWrapper
          .querySelector(".save-card")
          .addEventListener("click", () => {
            const text = input.value.trim();
            if (text) {
              const card = new Card(text);
              col.querySelector(".cards-container").appendChild(card.element);
              this.saveState();
            }
            inputWrapper.remove();
          });

        inputWrapper
          .querySelector(".cancel-card")
          .addEventListener("click", () => {
            inputWrapper.remove();
          });

        input.addEventListener("keydown", (evt) => {
          if (evt.key === "Enter")
            inputWrapper.querySelector(".save-card").click();
          if (evt.key === "Escape") inputWrapper.remove();
        });
      }
    });

    document.addEventListener("card-deleted", () => this.saveState());
  }

  saveState() {
    this.state = {};
    this.columns.forEach((colName) => {
      const cards = Array.from(
        this.container.querySelectorAll(
          `.column[data-name="${colName}"] .cards-container .card`
        )
      );
      this.state[colName] = cards.map((card) => ({
        text: card.querySelector(".card-text").textContent,
        id: card.dataset.id,
      }));
    });
    localStorage.setItem("boardState", JSON.stringify(this.state));
  }

  addDnDEvents() {
    let draggedCard = null;

    this.container.addEventListener("dragstart", (e) => {
      if (e.target.classList.contains("card")) {
        draggedCard = e.target;
        e.dataTransfer.effectAllowed = "move";
        e.target.classList.add("dragging");
      }
    });

    this.container.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (!draggedCard) return;

      // Находим контейнер, куда можно вставить карточку
      let container = e.target.closest(".cards-container");
      // Если контейнера нет (например, колонка пустая), проверяем, может это сама колонка
      if (!container && e.target.classList.contains("column")) {
        container = e.target.querySelector(".cards-container");
      }
      if (!container) return;

      // Находим карточку-таргет
      const target = e.target.closest(".card:not(.dragging)");

      if (!target) {
        // Если нет карточки, просто вставляем в конец
        container.appendChild(draggedCard);
      } else {
        const rect = target.getBoundingClientRect();
        const after = e.clientY > rect.top + rect.height / 2;
        container.insertBefore(
          draggedCard,
          after ? target.nextSibling : target
        );
      }
    });

    this.container.addEventListener("dragend", () => {
      if (draggedCard) {
        draggedCard.classList.remove("dragging");
        draggedCard = null;
        this.saveState();
      }
    });
  }
}

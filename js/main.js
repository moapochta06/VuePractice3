Vue.component('cardForm', {
    template: `
        <form class="card-form" @submit.prevent="onSubmit">
            <div class="errors" v-for="error in errors">{{ error }}</div>
            <input type="text" v-model="note" placeholder="Напишите заметку">
            <p>Задачи</p>
            <div v-for="(task, index) in tasks" :key="index">
                <input type="text" v-model="task.text" :placeholder="'Введите задачу'">
            </div>
            <button type="button" @click="addTask">Добавить задачу +</button>
            <div>
                <input type="date" class="inp-date" v-model="deadline" :min="minDate">
            </div>
            <div class="priority">
                <label>
                    <input type="checkbox" v-model="isPriority" >
                    Установить высокий приоритет
                </label>
            </div>
            <button type="submit" class="btn-save">Сохранить</button>
        </form>
    `,
    data() {
        return {
            note: null,
            tasks: [
                { text: '' },
                { text: '' },
                { text: '' }
            ],
            deadline: null,
            minDate: new Date().toISOString().split('T')[0],
            isPriority: false,
            errors: []
        }
    },
    computed: {
        emptyTasks() {
            return this.tasks.filter(task => task.text.trim() == '');
        }
    },
    methods: {
        onSubmit() {
            this.errors = [];
            if (this.note && this.tasks.length >= 3 && this.emptyTasks.length == 0 && this.deadline) {
                const time = new Date().toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });
                let cardData = {
                    note: this.note,
                    tasks: this.tasks,
                    deadline: this.deadline,
                    priority: this.isPriority,
                    time: time
                }
                this.$emit('card-submitted', cardData);

                this.note = null;
                this.tasks = [
                    { text: '' },
                    { text: '' },
                    { text: '' }
                ];
                this.deadline = null;
                this.isPriority = false;
            } else {
                if (this.emptyTasks.length > 0) this.errors.push("Задачи не могут быть пустыми!");
                if (!this.note) this.errors.push("Введите заметку!");
                if (!this.deadline) this.errors.push("Назначьте крайний срок!")
                if (this.tasks.length < 3) this.errors.push("Введите хотя бы 3 задачи!");
            }
        },
        addTask() {
            this.errors = [];
            if (this.tasks.length < 5) {
                const newTask = { text: '' };
                if (this.emptyTasks.length == 0) {
                    this.tasks.push(newTask);
                } else {
                    this.errors.push("Задачи не могут быть пустыми!");
                }
            } else {
                this.errors.push("Задач должно быть не больше 5!");
            }
        }
    }
});

Vue.component('card', {
    props: {
        card: {
            type: Object,
            required: true
        },
        isCompleted: {
            type: Boolean,
            default: false
        }
    },
    template: `
        <div class="card" @dragstart="$emit('dragstart', $event)" draggable="true">
            <h3>{{ card.note }}</h3>
            <div class="dots-btn" @click="toggleMenu" :class="{ active: isMenuVisible }">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
            <div  class="menu" v-if="isMenuVisible">
                <button class="edit-btn" @click="startEdit">Редактировать</button>
                <button class="del-btn">Удалить</button>
            </div>
            <p v-if="card.priority">Высокий приоритет</p>
            <ul>
                <li v-for="(task, index) in card.tasks" :key="index" :class="{ 'completed': task.completed }" class="task-item">
                    <input type="checkbox" v-model="task.completed" :disabled="isCompleted" >
                    {{ task.text }}
                </li>
            </ul>
            <p>Создано: {{ card.time }}<p>
            <p>До {{ formatDeadline }}</p>
            <p v-if="card.completionDate">Завершено: {{ formatDate }}</p>
        </div>
    `,
    data() {
        return{
            isEditing: false,
            isMenuVisible: false,
        }
    },
    computed: {
        formatDate() {
            const nowDate = new Date(this.card.completionDate);
            return nowDate.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        },
        formatDeadline() {
            const deadline = new Date(this.card.deadline);
            return deadline.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    },
    methods: {
        startEdit() {
            this.$emit('edit-card', this.card)
            this.toggleMenu();
        },
        toggleMenu() {
            this.isMenuVisible = !this.isMenuVisible;
        },
    }
});

Vue.component('column', {
    props: {
        title: {
            type: String,
            required: true
        },
        cards: {
            type: Array,
            required: true
        }
    },
    template: `
        <div class="column" @dragover="dragoverHandler" @drop="dropHandler">
            <h2>{{ title }}</h2>
            <button v-if="title=='Запланировано'" @click="showForm">Создать заметку +</button>
            <card v-for="(card, index) in cards" :key="card.note + index" 
            :card="card" :isCompleted="title == 'Выполнено'" 
            @dragstart="dragstartHandler($event, card)"> 
            </card>
        </div>
    `,
    data() {
        return {
            isFormVisible: false
        }
    },
    methods: {
        showForm() {
            this.$emit('open-modal');
        },
        dragstartHandler(ev, card) {
            ev.dataTransfer.setData("application/json", JSON.stringify(card));
            console.log(card);
        },
        dragoverHandler(ev) {
            ev.preventDefault();
            ev.dataTransfer.dropEffect = "move";
        },
        dropHandler(ev) {
            const cardData = JSON.parse(ev.dataTransfer.getData("application/json"));
            this.$emit('card-dropped', cardData);
        }

    }
});

Vue.component('board', {
    template: `
    <div class="app-container">
        <div class="columns-container">
            <column 
                title="Запланировано" 
                :maxCards="3" 
                :cards="column1Cards" 
                @open-modal="openModal"
                @card-dropped="moveCard(column1Cards, $event)"
            ></column>
            <column 
                title="В работе" 
                :cards="column2Cards" 
                @card-dropped="moveCard(column2Cards, $event)"
            ></column>
            <column
                title="Тестирование"
                :cards="column3Cards" 
                @card-dropped="moveCard(column3Cards, $event)"
            ></column>
            <column 
                title="Выполнено" 
                :cards="column4Cards"
                @card-dropped="moveCard(column4Cards, $event)"
            ></column>
        </div>
        <!-- Модальное окно -->
        <div v-if="isModalVisible" class="modal-overlay">
            <div class="modal-content">
                <card-form @card-submitted="addCardToColumn1"></card-form>
                <button @click="closeModal" class="close-btn">Закрыть</button>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            column1Cards: [],
            column2Cards: [],
            column3Cards: [],
            column4Cards: [],
            isModalVisible: false
        }
    },
    methods: {
        openModal() {
            this.isModalVisible = true;
        },
        closeModal() {
            this.isModalVisible = false;
        },
        addCardToColumn1(cardData) {
            this.addCardWithPriority(this.column1Cards, cardData);
            this.saveData();
        },
        moveCard(targetColumn, cardData) {
            // Удаляем карточку из исходной колонки
            const sourceColumns = [
                this.column1Cards,
                this.column2Cards,
                this.column3Cards,
                this.column4Cards
            ];
            for (const column of sourceColumns) {
                const index = column.findIndex(card => card.note == cardData.note);
                if (index !== -1) {
                    column.splice(index, 1);
                    break;
                }
            }// Добавляем карточку в целевую колонку
            targetColumn.push(cardData);
            this.saveData();
        },
        addCardWithPriority(cardsArray, cardData) {
            if (cardData.priority) {
                cardsArray.unshift(cardData);
            } else {
                const firstNonPriorityIndex = cardsArray.findIndex(card => !card.priority);
                if (firstNonPriorityIndex === -1) {
                    cardsArray.push(cardData);
                } else {
                    cardsArray.splice(firstNonPriorityIndex, 0, cardData);
                }
            }
        },

        saveData() {
            const data = {
                column1Cards: this.column1Cards,
                column2Cards: this.column2Cards,
                column3Cards: this.column3Cards,
                column4Cards: this.column4Cards
            }
            localStorage.setItem('boardData', JSON.stringify(data));
        },
        loadData() {
            const data = localStorage.getItem('boardData');
            if (data) {
                const parsedData = JSON.parse(data);
                this.column1Cards = parsedData.column1Cards;
                this.column2Cards = parsedData.column2Cards;
                this.column3Cards = parsedData.column3Cards;
                this.column4Cards = parsedData.column4Cards;
            }
        }
    },
    created() {
        this.loadData();
    }

});



let app = new Vue({
    el: '#app'
});

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
                { text:''},
                { text:''},
                { text:''}
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

                const newTask = {text:''};

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
        isBlocked: {
            type: Boolean,
            default: false
        },
        isCompleted: {
            type: Boolean,
            default: false
        }
    },
    template: `
        <div class="card">
            <h3>{{ card.note }}</h3>
            <p v-if="card.priority">Высокий приоритет</p>
            <ul>
                <li v-for="(task, index) in card.tasks" :key="index" :class="{ 'completed': task.completed }" class="task-item">
                    <input type="checkbox" v-model="task.completed" @change="checkProgress" :disabled="isBlocked||isCompleted" >
                    {{ task.text }}
                </li>
            </ul>
            <p>Создано: {{ card.time }}<p>
            <p>До {{ formatDeadline }}</p>
            <p v-if="card.completionDate">Завершено: {{ formatDate }}</p>
        </div>
    `,
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
        checkProgress() {
            const completedTasks = this.card.tasks.filter(task => task.completed).length;
            const allTasks = this.card.tasks.length;
            const progress = (completedTasks / allTasks) * 100;
            const date = Date.now();
            if (progress >= 50 && progress < 100) {
                this.$emit('move-card', { card: this.card, targetColumn: 'column2'}); // переместить в колонку 2
             
            } else if (progress === 100) {
                this.$emit('move-card', { card: this.card, targetColumn: 'column3', cardDate: date}); // переместить в колонку 3
            
            }
        }
    }
});

Vue.component('column', {
    props: {
        isBlocked: {
            type: Boolean,
            default: false
        },
        title: {
            type: String,
            required: true
        },
        maxCards: {
            type: Number,
            required: true
        },
        cards: {
            type: Array,
            required: true
        }
    },
    template: `
        <div class="column">
            <h2>{{ title }}</h2>
            <button v-if="title=='Запланировано'" @click="showForm" :disabled="isBlocked">Создать заметку +</button>
            <card v-for="(card, index) in cards" :key="card.note + index" :card="card" :isBlocked="isBlocked" :isCompleted="title == 'Выполнено'" @move-card="moveCard"></card>
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
        moveCard(moveData) {
            this.$emit('move-card', moveData); 
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
                :isBlocked="isBlocked" 
                @move-card="moveCard"
                @open-modal="openModal"
            ></column>
            <column 
                title="В работе" 
                :maxCards="5" 
                :cards="column2Cards" 
                @move-card="moveCard"
            ></column>
            <column
                title="Тестирование"
                :cards="column4Cards" 
                :isBlocked="isBlocked" 
                @move-card="moveCard"
            ></column>
            <column 
                title="Выполнено" 
                :cards="column3Cards"
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
            isBlocked: false,
            isModalVisible: false 
        }
    },
    methods: {
        openModal() {
            this.isModalVisible = true; 
            console.log('Модальное окно должно открыться');
        },
        closeModal() {
            this.isModalVisible = false; 
            console.log('Модальное окно закрыто');
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
        addCardToColumn1(cardData) {
            this.addCardWithPriority(this.column1Cards, cardData); 
            this.saveData();
        },
        moveCard({ card, targetColumn, cardDate }) {
            if (this.column2Cards.length >= 5 && targetColumn == 'column2') {
                this.isBlocked = true;
                this.saveData();
                return; 
            } else {
                this.isBlocked = false;
            }
            this.column1Cards = this.column1Cards.filter(c => c !== card);
            this.column2Cards = this.column2Cards.filter(c => c !== card);

            if (targetColumn == 'column2') {
                this.addCardWithPriority(this.column2Cards, card);
            } else if (targetColumn == 'column3') {
                card.completionDate = cardDate;
                card.disabled = true; 
                this.addCardWithPriority(this.column3Cards, card);
            }
            this.saveData();
        },
        saveData() {
            const data = {
                column1Cards: this.column1Cards,
                column2Cards: this.column2Cards,
                column3Cards: this.column3Cards,
                column4Cards: this.column4Cards,
                isBlocked : this.isBlocked
            };
            localStorage.setItem('boardData', JSON.stringify(data));
        },
        loadData() {
            const data = localStorage.getItem('boardData');
            if (data) {
                const parsedData = JSON.parse(data);
                this.column1Cards = parsedData.column1Cards;
                this.column2Cards = parsedData.column2Cards;
                this.column3Cards = parsedData.column3Cards;
                this.column4Cards = parsedData.column4Cards,
                this.isBlocked = parsedData.isBlocked;
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

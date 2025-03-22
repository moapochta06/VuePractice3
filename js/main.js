Vue.component('cardForm', {
    props: {
        isEditing: {
            type: Boolean,
            required: false
        },
        card: {
            type: Object,
            required: false
        }
    },
    template: `
        <form class="card-form" @submit.prevent="onSubmit">
            <div class="errors" v-for="error in errors">{{ error }}<div>
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
            <button v-if="!isEditing" type="submit" class="btn-save">Сохранить</button>
            <button v-else type="submit" class="btn-save" @click="$emit('updated')">Сохранить изменения</button>
        </form>
    `,
    data() {
        return {
            note: this.card ? this.card.note : null,
            tasks: this.card ? this.card.tasks.map(task => ({ text: task.text })) : [
                { text: '' }
            ],
            deadline: this.card ? this.card.deadline : null,
            minDate: new Date().toISOString().split('T')[0],
            isPriority: this.card ? this.card.priority : false,
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
            if (this.note && this.emptyTasks.length == 0 && this.deadline) {
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
                if (!this.isEditing) {
                    this.resetForm();
                }

            } else {
                if (this.emptyTasks.length > 0) this.errors.push("Задачи не могут быть пустыми!");
                if (!this.note) this.errors.push("Введите заметку!");
                if (!this.deadline) this.errors.push("Назначьте крайний срок!")
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
        },
        resetForm() {
            this.note = null;
            this.tasks = [
                { text: '' }
            ];
            this.deadline = null;
            this.isPriority = false;
            this.errors = [];
            this.$emit('form-reset');
        }
    }
});

Vue.component('returnReasonModal', {
    props: {
        card: {
            type: Object,
            required: true
        }
    },
    template: `
        <div class="modal-overlay">
            <div class="modal-content">
                <h3>Укажите причину возврата</h3>
                
                <div v-for="(task, index) in tasks" :key="index" class="task-with-reason">
                    <div class="task-text">{{ task.text }}</div>
                    
                    <select v-model="selectedReasons[index]">
                        <option value="">Кому</option>
                        <option value="front">Frontend</option>
                        <option value="back">Backend</option>
                        <option value="design">Дизайн</option>
                    </select>
                </div>
                
                <textarea v-model="generalReason" placeholder="Общая причина возврата"></textarea>
                
                <button @click="submitReason">Подтвердить</button>
                <button @click="cancel">Отмена</button>
            </div>
        </div>
    `,
    data() {
        return {
            generalReason: '',
            selectedReasons: this.card.tasks.map(() => '')
        };
    },
    computed: {
        tasks() {
            return this.card.tasks;
        },
        isFormValid() {
            return this.generalReason.trim() !== '' || 
                   this.selectedReasons.some(reason => reason !== '');
        }
    },
    methods: {
        submitReason() {
            if (!this.isFormValid) {
                alert('Пожалуйста, укажите причину возврата.');
                return;
            }
            const fullReason = this.generalReason.trim();
        
            if (fullReason) {
                this.$emit('reason-submitted', fullReason);
            } else {
                alert('Пожалуйста, укажите причину возврата.');
            }
        },
        cancel() {
            this.$emit('cancel');
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
        },
        isEditing: {
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
                <button class="del-btn" @click="deleteCard">Удалить</button>
            </div>
            <p v-if="card.priority">Высокий приоритет</p>
            <ul>
                <li v-for="(task, index) in card.tasks" :key="index" :class="{ 'completed': task.completed }" class="task-item">
                    <input type="checkbox" v-model="task.completed" :disabled="isCompleted" >
                    {{ task.text }}
                    <span v-if="task.assignee" class="assignee-label">{{ task.assignee }}</span>
                </li>
            </ul>
            <p v-if="isEditing">Обновлено: {{ card.time }}</p>
            <p v-else>Создано: {{ card.time }}</p>
            <p>До {{ formatDeadline }}</p>
            <p v-if="card.returnReason">Причина возврата: {{ card.returnReason }}</p>
            <p v-if="card.completionDate">Завершено: {{ formatDate }}</p>
            <p v-if="card.status">{{ card.status }}</p>
        </div>
    `,
    data() {
        return{
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
        deleteCard() {
            this.$emit('delete-card', this.card);
            this.toggleMenu();
        }
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
            @dragstart="dragstartHandler($event, card)"
            :isEditing="isEditing"
            @edit-card="editCard(card)"
            @delete-card="$emit('delete-card', card)"
            :columnTitle="title"
            > 
            </card>
        </div>
    `,
    data() {
        return {
            isFormVisible: false,
            isEditing: false,
        }
    },
    methods: {
        editCard(card) {
            this.$emit('edit-card', card); 
            this.isEditing = true; 
        },
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
                @edit-card="editCard"
                @delete-card="deleteCard"
            ></column>
            <column 
                title="В работе" 
                :cards="column2Cards" 
                @card-dropped="moveCard(column2Cards, $event)"
                @edit-card="editCard"
                @delete-card="deleteCard"
            ></column>
            <column
                title="Тестирование"
                :cards="column3Cards" 
                @card-dropped="moveCard(column3Cards, $event)"
                @edit-card="editCard"
                @delete-card="deleteCard"
            ></column>
            <column 
                title="Выполнено" 
                :cards="column4Cards"
                @card-dropped="moveCard(column4Cards, $event)"
                @delete-card="deleteCard"
            ></column>
        </div>
        <!-- Модальное окно -->
        <div v-if="isModalVisible" class="modal-overlay">
            <div class="modal-content">
                <card-form @card-submitted="addCardToColumn1" :isEditing="isEditing" :card="editingCard"></card-form>
                <button @click="closeModal" class="close-btn">Закрыть</button>
            </div>
        </div>
         <!-- Модальное окно для указания причины возврата -->
        <returnReasonModal v-if="showReasonModal" @reason-submitted="submitReturnReason" @cancel="cancelReturnReason" :card="draggedCard"></returnReasonModal>
    </div>
    `,
    data() {
        return {
            column1Cards: [],
            column2Cards: [],
            column3Cards: [],
            column4Cards: [],
            isModalVisible: false,
            isEditing: false,
            editingCard: null,
            showReasonModal: false, 
            draggedCard: null,
            targetColumn: null
        }
    },
    methods: {
        getColumns() {
            return [
                this.column1Cards,
                this.column2Cards,
                this.column3Cards,
                this.column4Cards
            ];
        },
        openModal() {
            this.isModalVisible = true;
        },
        closeModal() {
            this.isModalVisible = false;
            this.resetForm();
        },
        addCardToColumn1(cardData) {
            if (this.isEditing) {
                this.updateCard(cardData);
            } else {
                this.addCardWithPriority(this.column1Cards, cardData);
            }
            this.saveData();
            this.closeModal();
        },
        moveCard(targetColumn, cardData) {
            const columns = this.getColumns();
            const sourceColumnIndex = columns.findIndex(column =>
                column.some(card => JSON.stringify(card) == JSON.stringify(cardData))
            );
            const targetColumnIndex = columns.indexOf(targetColumn);
            const sourceColumn = columns[sourceColumnIndex];
            const cardIndex = sourceColumn.findIndex(card => JSON.stringify(card) == JSON.stringify(cardData));
            const cardToMove = sourceColumn[cardIndex];
            if (sourceColumnIndex === 2) { // Если из колонки "Тестирование"
                if (targetColumnIndex === 1) { // В "В работе"
                    this.draggedCard = cardToMove;
                    this.targetColumn = targetColumn;
                    this.showReasonModal = true;
                    return;
                } else if (targetColumnIndex !== 3) {
                    alert('Из колонки "Тестирование" можно перемещать только в колонки "В работе" или "Выполнено".');
                    return;
                }} 
            if (targetColumnIndex === 3) { // Если карточка перемещается в "Выполнено"
                const deadlineDate = new Date(cardToMove.deadline);
                const currentDate = new Date();
               
                // Устанавливаем время дедлайна на конец дня
                deadlineDate.setHours(23, 59, 59, 999);

                // Добавляем отметку о статусе выполнения
                if (currentDate > deadlineDate) {
                    cardToMove.status = 'Просрочено';
                } else {
                    cardToMove.status = 'Выполнено в срок';
                }
                
                // Добавляем дату завершения
                cardToMove.completionDate = currentDate.toISOString();
            }
        
            // Удаление карточки из исходной колонки
            sourceColumn.splice(cardIndex, 1);

            // Добавление в целевую колонку
            const clonedCard = JSON.parse(JSON.stringify(cardToMove)); 
            targetColumn.unshift(clonedCard);
            
            this.saveData();
        },
        deleteCard(cardData) {
            let updated = false;
            this.getColumns().forEach(column => {
                if (updated) return;
                const index = column.findIndex(card => JSON.stringify(card) == JSON.stringify(cardData));
                column.splice(index, 1);
                updated = true;
            });
            if (updated) {
                this.saveData();
            }
        },
        updateCard(cardData) {
            let updated = false;
            this.getColumns().forEach(column => {
                if (updated) return;
                const index = column.findIndex(card => JSON.stringify(card) == JSON.stringify(this.editingCard));
                if (index > -1) {
                    // Создаем новый объект с обновленными данными и сохраняем ссылки на существующие свойства
                    const updatedCard = {
                        ...this.editingCard, // сохраняем существующие свойства
                        ...cardData,         // применяем обновленные данные
                        time: new Date().toLocaleString('ru-RU', { // обновляем время изменения
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })
                    };
                    column.splice(index, 1, updatedCard); // заменяем старую карточку на обновленную
                    updated = true;
                }
            });
        },
        editCard(card) {
            this.editingCard = card;
            this.isEditing = true;
            this.openModal()
        },
        resetForm() {
            this.editingCard = null;
            this.isEditing = false;
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
        },
        submitReturnReason(reason) {
            if (this.draggedCard && this.targetColumn) {
                this.draggedCard.returnReason = reason;
        
                // Находим исходную колонку
                const columns = this.getColumns();
                const sourceColumn = columns.find(column => 
                    column.some(card => JSON.stringify(card) == JSON.stringify(this.draggedCard))
                );
                if (sourceColumn) {
                    // Удаляем карточку из исходной колонки
                    const index = sourceColumn.findIndex(card => 
                        JSON.stringify(card) == JSON.stringify(this.draggedCard)
                    );
                    if (index > -1) {
                        sourceColumn.splice(index, 1);
                    }
                }
                this.targetColumn.push(this.draggedCard);
        
                // Очищаем состояние
                this.showReasonModal = false;
                this.draggedCard = null;
                this.targetColumn = null;
                this.saveData();
            }
        },
        cancelReturnReason() {
            this.showReasonModal = false;
            this.draggedCard = null;
            this.targetColumn = null;
        }
    },
    created() {
        this.loadData();
    }
});

let app = new Vue({
    el: '#app'
});

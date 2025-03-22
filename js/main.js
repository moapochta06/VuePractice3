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
            this.errors = [];
            this.$emit('form-reset');
        }
    }
});

Vue.component('returnReasonModal', {
    props: {
        tasks: {
            type: Array,
            required: true
        }
    },
    template: `
        <div class="modal-overlay">
            <div class="modal-content">
                <h3>Укажите причину возврата</h3>
                <p>Задачи:</p>
                <div v-for="(task, index) in tasks" :key="index" class="task-with-reason">
                    <span class="task-text">{{ task.text }}</span>
                    <select v-model="task.role" class="role-select">
                        <option value="">Кому</option>
                        <option value="front">Фронт</option>
                        <option value="back">Бэк</option>
                        <option value="design">Дизайн</option>
                    </select>
                </div>
                <textarea v-model="reason" placeholder="Причина возврата"></textarea>
                <button @click="submitReason">Подтвердить</button>
                <button @click="cancel">Отмена</button>
            </div>
        </div>
    `,
    data() {
        return {
            reason: ''
        };
    },
    methods: {
        submitReason() {
            if (this.reason.trim() !== '') {
                this.$emit('reason-submitted', { reason: this.reason, tasks: this.tasks });
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
            <div class="menu" v-if="isMenuVisible">
                <button class="edit-btn" @click="startEdit">Редактировать</button>
                <button class="del-btn" @click="deleteCard">Удалить</button>
            </div>
            <p v-if="card.priority" class="priority-label">Высокий приоритет</p>
            <ul>
                <li v-for="(task, index) in card.tasks" :key="index" :class="{ 'completed': task.completed }" class="task-item">
                    <div>
                    <input type="checkbox" v-model="task.completed" :disabled="isCompleted">
                    <span class="task-text">{{ task.text }}</span>
                    </div>
                    <span v-if="task.role" class="assignee-label">{{ task.role }}</span>
                </li>
            </ul>
            <p v-if="isEditing" class="time-info">Обновлено: {{ card.time }}</p>
            <p v-else class="time-info">Создано: {{ card.time }}</p>
            <p class="deadline-info">До {{ formatDeadline }}</p>
            <p v-if="card.returnReason" class="return-reason">Причина возврата: {{ card.returnReason }}</p>
            <p v-if="card.completionDate" class="completion-date">Завершено: {{ formatDate }}</p>

            <p v-if="card.status == 'overdue'" class="status overdue">Просрочено</p>
            <p v-else-if="card.status == 'completedOnTime'" class="status on-time">Выполнено в срок</p>
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
         <returnReasonModal v-if="showReasonModal" :tasks="draggedCard.tasks" @reason-submitted="submitReturnReason" @cancel="cancelReturnReason"></returnReasonModal>
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
            cardData.tasks.forEach(task => {
                task.role = ''; // Изначально роль не выбрана
            });
            if (this.isEditing) {
                this.updateCard(cardData);
            } else {
                this.column1Cards.unshift(cardData);
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
            if (sourceColumnIndex === 0 && targetColumnIndex === 2) { 
                alert('Нельзя перемещать карточку из "Запланировано" в "Тестирование".');
                return;
            }
            if (sourceColumnIndex === 3 && targetColumnIndex === 0) { 
                alert('Нельзя перемещать карточку из "Выполнено" в "Запланировано".');
                return;
            }
            if (sourceColumnIndex === 1 && targetColumnIndex === 3) { 
                alert('Нельзя перемещать карточку из "В работе" в "Выполнено".');
                return;
            }
            if (sourceColumnIndex === 0 && targetColumnIndex === 3) { 
                alert('Нельзя перемещать карточку из "Запланировано" в "Выполнено".');
                return;
            }
            if (sourceColumnIndex === 3 && targetColumnIndex === 1) { 
                alert('Нельзя перемещать карточку из "Выполнено" в "В работе".');
                return;
            }
        
            if (sourceColumnIndex === 2) { // Если из колонки "Тестирование"
                if (targetColumnIndex === 1) { // В "В работе"
                    this.draggedCard = cardToMove;
                    this.targetColumn = targetColumn;
                    this.showReasonModal = true;
                    return;
                } else if (targetColumnIndex !== 3) {
                    alert('Из колонки "Тестирование" можно перемещать только в колонки "В работе" или "Выполнено".');
                    return;
                }
            }
        
            // Удаление карточки из исходной колонки
            sourceColumn.splice(cardIndex, 1);
        
            // Добавление в целевую колонку
            const clonedCard = JSON.parse(JSON.stringify(cardData));
        
            // Если целевая колонка — "Выполнено", проверяем дедлайн
            if (targetColumnIndex === 3) { // Индекс столбца "Выполнено"
                const currentDate = new Date();
                const deadlineDate = new Date(clonedCard.deadline);
                deadlineDate.setHours(23, 59, 59, 999);
                if (currentDate > deadlineDate) {
                    clonedCard.status = "overdue"; // Просрочено
                } else {
                    clonedCard.status = "completedOnTime"; // Выполнено в срок
                }
        
                // Добавляем дату завершения
                clonedCard.completionDate = currentDate.toISOString();
            }
        
            targetColumn.unshift(clonedCard);
        
            // Сохраняем данные после успешного перемещения
            this.saveData();
        },
        deleteCard(cardData) {
            let updated = false;
            this.getColumns().forEach(column => {
                if (updated) return; // Если карточка уже удалена, выходим из цикла
                const index = column.findIndex(card => JSON.stringify(card) === JSON.stringify(cardData));
                if (index > -1) {
                    column.splice(index, 1);
                    updated = true;
                }
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
        submitReturnReason({ reason, tasks }) {
            if (this.draggedCard && this.targetColumn) {
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
        
                // Добавляем причину возврата и обновляем задачи с ролями
                this.draggedCard.returnReason = reason;
                this.draggedCard.tasks = tasks; // Обновляем задачи с выбранными ролями
        
                // Перемещаем в новую колонку
                this.targetColumn.push(this.draggedCard);
        
                // Очищаем состояние
                this.showReasonModal = false;
                this.draggedCard = null;
                this.targetColumn = null;
        
                // Сохраняем данные
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

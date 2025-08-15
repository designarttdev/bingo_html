// Classe para representar uma cartela de bingo
class BingoCard {
    constructor(id, numbers = null) {
        this.id = id;
        this.numbers = numbers || this.generateCard();
    }

    generateCard() {
        // Matriz 5x5 para armazenar os números da cartela
        const card = Array(5).fill().map(() => Array(5).fill(0));
        
        // Para cada coluna, gerar 5 números únicos do intervalo correspondente
        for (let col = 0; col < 5; col++) {
            const start = col * 15 + 1;
            const end = start + 14;
            const columnNumbers = this.getRandomNumbers(start, end, 5);
            
            // Preencher a coluna com os números gerados
            for (let row = 0; row < 5; row++) {
                card[row][col] = columnNumbers[row];
            }
        }
        
        // Definir o espaço livre no centro (posição 2,2)
        card[2][2] = 0;
        
        return card;
    }

    getRandomNumbers(min, max, count) {
        const numbers = [];
        const availableNumbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
        
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * availableNumbers.length);
            numbers.push(availableNumbers.splice(randomIndex, 1)[0]);
        }
        
        return numbers;
    }
}

// Classe para gerenciar o jogo de bingo
class BingoGame {
    constructor() {
        this.cards = [];
        this.drawnNumbers = [];
        this.maxNumber = 75; // Valor padrão
        this.availableNumbers = Array.from({ length: this.maxNumber }, (_, i) => i + 1); // Números de 1 a 75
        this.editingCard = null;
        this.bingoType = 'line';
        this.sortMode = 'history';
        
        // Inicializar elementos da UI
        this.initUI();
        this.initTheme();
        
        // Carregar dados salvos
        this.loadGame();
        
        // Renderizar o estado inicial
        this.renderGame();
    }

    initUI() {
        // Botões e inputs desktop
        document.getElementById('add-card-auto').addEventListener('click', () => this.addCardAuto());
        document.getElementById('add-card-manual').addEventListener('click', () => this.showManualCardModal());
        document.getElementById('mark-number').addEventListener('click', () => this.markManualNumber());
        document.getElementById('draw-random').addEventListener('click', () => this.drawRandomNumber());
        document.getElementById('reset-game').addEventListener('click', () => this.resetGame());
        document.getElementById('notification-close').addEventListener('click', () => this.hideNotification());
        document.getElementById('save-config').addEventListener('click', () => this.saveConfig());
        
        // Modal de configurações mobile
        document.getElementById('open-config-mobile').addEventListener('click', () => this.showConfigModal());
        document.getElementById('close-config-modal').addEventListener('click', () => this.hideConfigModal());
        document.getElementById('save-mobile-config').addEventListener('click', () => this.saveMobileConfig());
        
        // Botões mobile duplicados
        document.getElementById('mobile-add-card-auto').addEventListener('click', () => this.addCardAutoMobile());
        document.getElementById('mobile-add-card-manual').addEventListener('click', () => this.showManualCardModalMobile());
        document.getElementById('mobile-draw-random').addEventListener('click', () => this.drawRandomNumber());
        document.getElementById('mobile-reset-game').addEventListener('click', () => this.resetGameMobile());
        
        // Modal de edição de número
        document.getElementById('save-edit-number').addEventListener('click', () => this.saveEditedNumber());
        document.getElementById('cancel-edit-number').addEventListener('click', () => this.hideEditNumberModal());

        // Definir valor inicial do tipo de bingo
        const bingoTypeSelect = document.getElementById('bingo-type');
        bingoTypeSelect.value = this.bingoType;
        bingoTypeSelect.addEventListener('change', () => {
            this.bingoType = bingoTypeSelect.value;
            this.saveGame();
        });

        // Ordenação dos números sorteados
        const orderSelect = document.getElementById('numbers-order');
        if (orderSelect) {
            orderSelect.value = this.sortMode;
            orderSelect.addEventListener('change', () => {
                this.sortMode = orderSelect.value;
                this.saveGame();
                this.renderDrawnNumbers();
            });
        }
        
        // Modal de cartela manual
        document.getElementById('save-manual-card').addEventListener('click', () => this.saveManualCard());
        document.getElementById('cancel-manual-card').addEventListener('click', () => this.hideManualCardModal());
        
        // Permitir pressionar Enter no input de número
        document.getElementById('drawn-number').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.markManualNumber();
            }
        });
        
        // Permitir pressionar Enter no input de ID da cartela
        document.getElementById('card-id').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addCardAuto();
            }
        });
        
        // Permitir pressionar Enter no input de edição de número
        document.getElementById('edit-number-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveEditedNumber();
            }
        });

        const numbersContainer = document.getElementById('drawn-numbers');
        numbersContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('drawn-number')) {
                const index = parseInt(e.target.dataset.index);
                this.editDrawnNumber(index);
            }
        });
    }

    initTheme() {
        const saved = localStorage.getItem('theme') || 'dark';
        const toggleBtn = document.getElementById('toggle-theme');
        const mobileToggleBtn = document.getElementById('mobile-toggle-theme');
        
        document.body.classList.toggle('dark', saved === 'dark');
        const themeText = saved === 'dark' ? 'Modo Claro' : 'Modo Escuro';
        toggleBtn.textContent = themeText;
        mobileToggleBtn.textContent = themeText;
        
        const toggleTheme = () => {
            const dark = document.body.classList.toggle('dark');
            localStorage.setItem('theme', dark ? 'dark' : 'light');
            const newThemeText = dark ? 'Modo Claro' : 'Modo Escuro';
            toggleBtn.textContent = newThemeText;
            mobileToggleBtn.textContent = newThemeText;
        };
        
        toggleBtn.addEventListener('click', toggleTheme);
        mobileToggleBtn.addEventListener('click', toggleTheme);
    }

    saveConfig() {
        const maxNumberInput = document.getElementById('max-number');
        const newMaxNumber = parseInt(maxNumberInput.value);
        const bingoTypeSelect = document.getElementById('bingo-type');
        this.bingoType = bingoTypeSelect.value;

        if (isNaN(newMaxNumber) || newMaxNumber < 25 || newMaxNumber > 99) {
            this.showNotification('Erro', 'Por favor, informe um número válido entre 25 e 99.');
            return;
        }

        if (newMaxNumber !== this.maxNumber) {
            this.maxNumber = newMaxNumber;
            this.resetGame(true);
            this.showNotification('Sucesso', `Número máximo alterado para ${newMaxNumber}.`);
        } else {
            this.saveGame();
            this.showNotification('Sucesso', 'Configurações atualizadas.');
        }
    }
    
    // Funções específicas para o modal de configurações mobile
    showConfigModal() {
        // Sincronizar valores do desktop para o mobile
        document.getElementById('mobile-max-number').value = this.maxNumber;
        document.getElementById('mobile-bingo-type').value = this.bingoType;
        document.getElementById('mobile-card-id').value = document.getElementById('card-id').value;
        
        document.getElementById('config-modal').style.display = 'flex';
    }
    
    hideConfigModal() {
        document.getElementById('config-modal').style.display = 'none';
    }
    
    saveMobileConfig() {
        const maxNumberInput = document.getElementById('mobile-max-number');
        const newMaxNumber = parseInt(maxNumberInput.value);
        const bingoTypeSelect = document.getElementById('mobile-bingo-type');
        this.bingoType = bingoTypeSelect.value;

        if (isNaN(newMaxNumber) || newMaxNumber < 25 || newMaxNumber > 99) {
            this.showNotification('Erro', 'Por favor, informe um número válido entre 25 e 99.');
            return;
        }

        if (newMaxNumber !== this.maxNumber) {
            this.maxNumber = newMaxNumber;
            // Sincronizar com o desktop
            document.getElementById('max-number').value = newMaxNumber;
            document.getElementById('bingo-type').value = this.bingoType;
            this.resetGame(true);
            this.showNotification('Sucesso', `Número máximo alterado para ${newMaxNumber}.`);
        } else {
            // Sincronizar com o desktop
            document.getElementById('max-number').value = newMaxNumber;
            document.getElementById('bingo-type').value = this.bingoType;
            this.saveGame();
            this.showNotification('Sucesso', 'Configurações atualizadas.');
        }
        
        this.hideConfigModal();
    }
    
    // Métodos mobile duplicados para sincronização
    addCardAutoMobile() {
        const cardIdInput = document.getElementById('mobile-card-id');
        const cardId = cardIdInput.value.trim();
        
        // Sincronizar com o desktop
        document.getElementById('card-id').value = cardId;
        
        this.addCardAuto();
        this.hideConfigModal();
    }
    
    showManualCardModalMobile() {
        this.hideConfigModal();
        this.showManualCardModal();
    }
    
    resetGameMobile() {
         this.resetGame();
         this.hideConfigModal();
     }

    addCardAuto() {
        const cardIdInput = document.getElementById('card-id');
        const cardId = cardIdInput.value.trim();
        
        if (!cardId) {
            this.showNotification('Erro', 'Por favor, informe um número ou identificador para a cartela.');
            return;
        }
        
        // Verificar se já existe uma cartela com este ID
        if (this.cards.some(card => card.id === cardId)) {
            this.showNotification('Erro', `Já existe uma cartela com o ID "${cardId}".`);
            return;
        }
        
        // Criar nova cartela
        const card = new BingoCard(cardId);
        this.cards.push(card);
        
        // Limpar input
        cardIdInput.value = '';
        
        // Salvar e renderizar
        this.saveGame();
        this.renderCards();
    }

    showManualCardModal(card = null) {
        const modal = document.getElementById('manual-card-modal');
        const cardIdInput = document.getElementById('card-id');
        const manualCardIdInput = document.getElementById('manual-card-id');
        const title = document.getElementById('manual-card-title');

        this.editingCard = card;

        const inputs = modal.querySelectorAll('.manual-input');

        if (card) {
            // Preencher com dados existentes
            title.textContent = 'Editar Cartela';
            manualCardIdInput.value = card.id;
            manualCardIdInput.disabled = true;

            inputs.forEach(input => {
                const row = parseInt(input.dataset.row);
                const col = parseInt(input.dataset.col);
                if (row === 2 && col === 2) return;
                input.value = card.numbers[row][col];
            });
        } else {
            title.textContent = 'Adicionar Cartela Manual';
            manualCardIdInput.disabled = false;
            manualCardIdInput.value = cardIdInput.value.trim();
            inputs.forEach(input => {
                input.value = '';
            });
        }

        modal.classList.remove('hidden');
    }

    hideManualCardModal() {
        const modal = document.getElementById('manual-card-modal');
        modal.classList.add('hidden');
        this.editingCard = null;
    }

    validateManualInputs(inputs) {
        const cardNumbers = Array(5).fill().map(() => Array(5).fill(0));
        const used = new Set();

        for (const input of inputs) {
            const row = parseInt(input.dataset.row);
            const col = parseInt(input.dataset.col);

            if (row === 2 && col === 2) continue;

            const value = parseInt(input.value);

            if (isNaN(value) || value < 1 || value > this.maxNumber) {
                return { valid: false, message: `Por favor, informe números válidos entre 1 e ${this.maxNumber}.` };
            }

            if (used.has(value)) {
                return { valid: false, message: `O número ${value} está duplicado.` };
            }
            used.add(value);

            cardNumbers[row][col] = value;
        }

        cardNumbers[2][2] = 0;
        return { valid: true, numbers: cardNumbers };
    }

    saveManualCard() {
        const manualCardIdInput = document.getElementById('manual-card-id');
        const cardId = manualCardIdInput.value.trim();

        if (!cardId) {
            this.showNotification('Erro', 'Por favor, informe um ID para a cartela.');
            return;
        }

        if (!this.editingCard && this.cards.some(card => card.id === cardId)) {
            this.showNotification('Erro', `Já existe uma cartela com o ID "${cardId}".`);
            return;
        }

        const inputs = document.querySelectorAll('.manual-input');
        const validation = this.validateManualInputs(inputs);
        if (!validation.valid) {
            this.showNotification('Erro', validation.message);
            return;
        }

        if (this.editingCard) {
            this.editingCard.numbers = validation.numbers;
        } else {
            const card = new BingoCard(cardId, validation.numbers);
            this.cards.push(card);
        }
        
        // Fechar o modal
        this.hideManualCardModal();
        
        // Limpar o input do ID principal
        document.getElementById('card-id').value = '';
        
        // Salvar e renderizar
        this.saveGame();
        this.renderCards();
    }

    markManualNumber() {
        const numberInput = document.getElementById('drawn-number');
        const numberValue = parseInt(numberInput.value);
        
        if (isNaN(numberValue) || numberValue < 1 || numberValue > this.maxNumber) {
            this.showNotification('Erro', `Por favor, informe um número válido entre 1 e ${this.maxNumber}.`);
            return;
        }
        
        if (this.drawnNumbers.includes(numberValue)) {
            this.showNotification('Aviso', `O número ${numberValue} já foi sorteado.`);
            return;
        }
        
        // Adicionar número aos sorteados
        this.drawnNumbers.push(numberValue);
        
        // Remover da lista de disponíveis
        const index = this.availableNumbers.indexOf(numberValue);
        if (index !== -1) {
            this.availableNumbers.splice(index, 1);
        }
        
        // Limpar input
        numberInput.value = '';
        
        // Salvar e renderizar
        this.saveGame();
        this.renderGame();
        
        // Verificar se houve bingo
        this.checkBingo();
    }

    drawRandomNumber() {
        if (this.availableNumbers.length === 0) {
            this.showNotification('Aviso', 'Todos os números já foram sorteados!');
            return;
        }
        
        // Sortear um número aleatório dos disponíveis
        const randomIndex = Math.floor(Math.random() * this.availableNumbers.length);
        const drawnNumber = this.availableNumbers.splice(randomIndex, 1)[0];
        
        // Adicionar aos sorteados
        this.drawnNumbers.push(drawnNumber);
        
        // Salvar e renderizar
        this.saveGame();
        this.renderGame();
        
        // Verificar se houve bingo
        this.checkBingo();
    }

    editDrawnNumber(index) {
        this.editingNumberIndex = index;
        const oldNumber = this.drawnNumbers[index];
        
        // Configurar o modal
        document.getElementById('edit-number-input').value = oldNumber;
        document.getElementById('edit-number-input').max = this.maxNumber;
        
        // Mostrar o modal
        this.showEditNumberModal();
    }
    
    showEditNumberModal() {
        document.getElementById('edit-number-modal').classList.remove('hidden');
        document.getElementById('edit-number-input').focus();
    }
    
    hideEditNumberModal() {
        document.getElementById('edit-number-modal').classList.add('hidden');
        this.editingNumberIndex = null;
    }
    
    saveEditedNumber() {
        const input = document.getElementById('edit-number-input');
        const newNumber = parseInt(input.value);
        const index = this.editingNumberIndex;
        const oldNumber = this.drawnNumbers[index];
        
        if (isNaN(newNumber) || newNumber < 1 || newNumber > this.maxNumber) {
            this.showNotification('Erro', `Por favor, informe um número válido entre 1 e ${this.maxNumber}.`);
            return;
        }
        if (this.drawnNumbers.includes(newNumber) && newNumber !== oldNumber) {
            this.showNotification('Erro', `O número ${newNumber} já foi sorteado.`);
            return;
        }

        this.drawnNumbers[index] = newNumber;

        // Atualizar listas de disponíveis
        if (!this.drawnNumbers.includes(oldNumber)) {
            this.availableNumbers.push(oldNumber);
        }
        const idx = this.availableNumbers.indexOf(newNumber);
        if (idx !== -1) {
            this.availableNumbers.splice(idx, 1);
        }
        this.availableNumbers.sort((a, b) => a - b);

        this.saveGame();
        this.renderGame();
        this.checkBingo();
        
        // Fechar o modal
        this.hideEditNumberModal();
    }

    resetGame(configChanged = false) {
        if (!configChanged && !confirm('Deseja reiniciar o jogo? Isso manterá as cartelas, mas limpará os números sorteados.')) {
            return;
        }
        
        this.drawnNumbers = [];
        this.availableNumbers = Array.from({ length: this.maxNumber }, (_, i) => i + 1);
        
        // Salvar e renderizar
        this.saveGame();
        this.renderGame();
    }

    deleteCard(cardId) {
        const index = this.cards.findIndex(c => c.id === cardId);
        if (index !== -1 && confirm(`Excluir cartela #${cardId}?`)) {
            this.cards.splice(index, 1);
            this.saveGame();
            this.renderCards();
        }
    }

    checkBingo() {
        for (const card of this.cards) {
            const result = this.checkCardBingo(card);
            if (result) {
                const [type, pattern] = result;
                this.showNotification('BINGO!', `Bingo na cartela #${card.id}!\nTipo: ${type}`);
                return;
            }
        }
    }

    checkCardBingo(card) {
        if (this.bingoType === 'full') {
            if (this.checkFullCard(card)) {
                return ['Cartela Cheia', 'Cheia'];
            }
            return null;
        }

        // Verificar linhas horizontais
        for (let row = 0; row < 5; row++) {
            if (this.checkLine(card, row, 'horizontal')) {
                return ['Horizontal', row];
            }
        }
        
        // Verificar colunas verticais
        for (let col = 0; col < 5; col++) {
            if (this.checkLine(card, col, 'vertical')) {
                return ['Vertical', col];
            }
        }
        
        // Verificar diagonal principal (de cima-esquerda para baixo-direita)
        if (this.checkDiagonal(card, 'principal')) {
            return ['Diagonal', 'Principal'];
        }
        
        // Verificar diagonal secundária (de cima-direita para baixo-esquerda)
        if (this.checkDiagonal(card, 'secundaria')) {
            return ['Diagonal', 'Secundária'];
        }

        return null;
    }

    checkFullCard(card) {
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                if (row === 2 && col === 2) continue;
                const number = card.numbers[row][col];
                if (!this.drawnNumbers.includes(number)) {
                    return false;
                }
            }
        }
        return true;
    }

    checkLine(card, index, type) {
        for (let i = 0; i < 5; i++) {
            const row = type === 'horizontal' ? index : i;
            const col = type === 'horizontal' ? i : index;
            const number = card.numbers[row][col];
            
            // Se não for espaço livre (0) e não estiver marcado, não é bingo
            if (number !== 0 && !this.drawnNumbers.includes(number)) {
                return false;
            }
        }
        return true;
    }

    checkDiagonal(card, type) {
        for (let i = 0; i < 5; i++) {
            const col = type === 'principal' ? i : 4 - i;
            const number = card.numbers[i][col];
            
            // Se não for espaço livre (0) e não estiver marcado, não é bingo
            if (number !== 0 && !this.drawnNumbers.includes(number)) {
                return false;
            }
        }
        return true;
    }

    renderGame() {
        this.renderDrawnNumbers();
        this.renderCards();
    }

    renderDrawnNumbers() {
        const drawnNumbersContainer = document.getElementById('drawn-numbers');
        drawnNumbersContainer.innerHTML = '';
        
        let numbersWithIndex;
        if (this.sortMode === 'asc') {
            // Criar array com números e seus índices originais
            numbersWithIndex = this.drawnNumbers.map((num, idx) => ({ num, originalIndex: idx }));
            // Ordenar mantendo referência ao índice original
            numbersWithIndex.sort((a, b) => a.num - b.num);
        } else {
            // No modo histórico, usar a ordem original
            numbersWithIndex = this.drawnNumbers.map((num, idx) => ({ num, originalIndex: idx }));
        }

        numbersWithIndex.forEach(({ num, originalIndex }) => {
            const numberElement = document.createElement('div');
            numberElement.className = 'drawn-number';
            numberElement.textContent = num;
            numberElement.dataset.index = originalIndex; // Usar o índice original
            drawnNumbersContainer.appendChild(numberElement);
        });
    }

    renderCards() {
        const cardsContainer = document.getElementById('cards-container');
        cardsContainer.innerHTML = '';
        
        for (const card of this.cards) {
            const cardElement = this.createCardElement(card);
            cardsContainer.appendChild(cardElement);
        }
    }

    createCardElement(card) {
        // Clonar o template da cartela
        const template = document.getElementById('card-template');
        const cardElement = document.importNode(template.content, true).querySelector('.bingo-card');
        
        // Definir ID da cartela
        cardElement.dataset.cardId = card.id;
        cardElement.querySelector('.card-id').textContent = card.id;

        const editBtn = cardElement.querySelector('.edit-card');
        const deleteBtn = cardElement.querySelector('.delete-card');
        editBtn.addEventListener('click', () => this.showManualCardModal(card));
        deleteBtn.addEventListener('click', () => this.deleteCard(card.id));
        
        // Preencher os números
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                const number = card.numbers[row][col];
                const cell = cardElement.querySelector(`.card-row[data-row="${row}"] .card-cell[data-col="${col}"]`);
                
                // Espaço livre no centro
                if (row === 2 && col === 2) {
                    cell.textContent = 'FREE';
                    cell.classList.add('free');
                } else {
                    cell.textContent = number;
                    
                    // Marcar se o número já foi sorteado
                    if (this.drawnNumbers.includes(number)) {
                        cell.classList.add('marked');
                    }
                }
            }
        }
        
        return cardElement;
    }

    showNotification(title, message) {
        const notification = document.getElementById('notification');
        const titleElement = document.getElementById('notification-title');
        const messageElement = document.getElementById('notification-message');
        
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        notification.classList.remove('hidden');
    }

    hideNotification() {
        const notification = document.getElementById('notification');
        notification.classList.add('hidden');
    }

    saveGame() {
        const gameData = {
            cards: this.cards,
            drawnNumbers: this.drawnNumbers,
            maxNumber: this.maxNumber,
            bingoType: this.bingoType,
            sortMode: this.sortMode
        };

        localStorage.setItem('bingoGame', JSON.stringify(gameData));
    }

    loadGame() {
        const savedData = localStorage.getItem('bingoGame');
        
        if (savedData) {
            try {
                const gameData = JSON.parse(savedData);
                
                // Restaurar cartelas
                this.cards = gameData.cards.map(cardData => {
                    const card = new BingoCard(cardData.id);
                    card.numbers = cardData.numbers;
                    return card;
                });

                // Restaurar números sorteados
                this.drawnNumbers = gameData.drawnNumbers;

                this.maxNumber = gameData.maxNumber || this.maxNumber;
                this.bingoType = gameData.bingoType || this.bingoType;
                this.sortMode = gameData.sortMode || this.sortMode;

                document.getElementById('max-number').value = this.maxNumber;
                document.getElementById('bingo-type').value = this.bingoType;
                const orderSelect = document.getElementById('numbers-order');
                if (orderSelect) orderSelect.value = this.sortMode;

                // Atualizar números disponíveis
                this.availableNumbers = Array.from({ length: this.maxNumber }, (_, i) => i + 1)
                    .filter(num => !this.drawnNumbers.includes(num));
                
            } catch (error) {
                console.error('Erro ao carregar dados salvos:', error);
            }
        }
    }
}

// Inicializar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    const game = new BingoGame();
});

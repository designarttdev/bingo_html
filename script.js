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
        
        // Inicializar configurações
        this.initSettings();
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
        
        // Settings menu
        this.initSettingsMenu();
        
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
        
        // Botão de confirmação do número máximo (desktop)
        document.getElementById('confirm-max-number').addEventListener('click', () => {
            this.confirmMaxNumber();
        });
        
        // Botão de confirmação do número máximo (mobile)
        document.getElementById('mobile-confirm-max-number').addEventListener('click', () => {
            this.confirmMaxNumberMobile();
        });
        
        // Permitir pressionar Enter nos campos de número máximo
        document.getElementById('max-number').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.confirmMaxNumber();
            }
        });
        
        document.getElementById('mobile-max-number').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.confirmMaxNumberMobile();
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
        console.log('Inicializando tema...');
        
        // Buscar todos os botões de tema possíveis
        const toggleBtn = document.getElementById('toggle-theme');
        const mobileToggleBtn = document.getElementById('mobile-toggle-theme');
        const mobileThemeToggle = document.getElementById('mobile-theme-toggle'); // Novo botão de tema mobile
        
        console.log('Botões encontrados:', {
            toggleBtn: !!toggleBtn,
            mobileToggleBtn: !!mobileToggleBtn,
            mobileThemeToggle: !!mobileThemeToggle
        });
        
        // Verificar tema salvo
        const savedTheme = localStorage.getItem('theme');
        const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        console.log('Tema atual:', isDark ? 'dark' : 'light');
        
        // Aplicar tema
        if (isDark) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
        
        // Atualizar texto dos botões que têm texto
        const themeText = isDark ? 'Modo Claro' : 'Modo Escuro';
        if (toggleBtn) toggleBtn.textContent = themeText;
        if (mobileToggleBtn) mobileToggleBtn.textContent = themeText;
        
        const toggleTheme = () => {
            const dark = document.body.classList.toggle('dark');
            localStorage.setItem('theme', dark ? 'dark' : 'light');
            const newThemeText = dark ? 'Modo Claro' : 'Modo Escuro';
            
            // Atualizar texto dos botões que têm texto
            if (toggleBtn) toggleBtn.textContent = newThemeText;
            if (mobileToggleBtn) mobileToggleBtn.textContent = newThemeText;
            
            console.log('Tema alterado para:', dark ? 'dark' : 'light');
        };
        
        // Adicionar event listeners
        [toggleBtn, mobileToggleBtn, mobileThemeToggle].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', toggleTheme);
            }
        });
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
        
        const modal = document.getElementById('config-modal');
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
    
    hideConfigModal() {
        const modal = document.getElementById('config-modal');
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }
    
    // Confirmar número máximo (desktop) - salva imediatamente sem fechar pop-up
    confirmMaxNumber() {
        const maxNumberInput = document.getElementById('max-number');
        const newMaxNumber = parseInt(maxNumberInput.value);
        
        if (isNaN(newMaxNumber) || newMaxNumber < 25 || newMaxNumber > 99) {
            this.showNotification('Erro', 'Por favor, informe um número válido entre 25 e 99.');
            return;
        }
        
        if (newMaxNumber !== this.maxNumber) {
            this.maxNumber = newMaxNumber;
            // Sincronizar com o input mobile
            document.getElementById('mobile-max-number').value = newMaxNumber;
            this.resetGame(true);
            this.showNotification('Sucesso', `Número máximo alterado para ${newMaxNumber}. Jogo reiniciado.`);
        } else {
            this.showNotification('Info', 'Número máximo confirmado (sem alterações).');
        }
        
        this.saveGame();
    }
    
    // Confirmar número máximo (mobile) - salva imediatamente sem fechar pop-up
    confirmMaxNumberMobile() {
        const maxNumberInput = document.getElementById('mobile-max-number');
        const newMaxNumber = parseInt(maxNumberInput.value);
        
        if (isNaN(newMaxNumber) || newMaxNumber < 25 || newMaxNumber > 99) {
            this.showNotification('Erro', 'Por favor, informe um número válido entre 25 e 99.');
            return;
        }
        
        if (newMaxNumber !== this.maxNumber) {
            this.maxNumber = newMaxNumber;
            // Sincronizar com o input desktop
            document.getElementById('max-number').value = newMaxNumber;
            this.resetGame(true);
            this.showNotification('Sucesso', `Número máximo alterado para ${newMaxNumber}. Jogo reiniciado.`);
        } else {
            this.showNotification('Info', 'Número máximo confirmado (sem alterações).');
        }
        
        this.saveGame();
    }

    saveMobileConfig() {
        const bingoTypeSelect = document.getElementById('mobile-bingo-type');
        const newBingoType = bingoTypeSelect.value;
        
        if (newBingoType !== this.bingoType) {
            this.bingoType = newBingoType;
            // Sincronizar com o select desktop
            document.getElementById('bingo-type').value = newBingoType;
            this.checkBingo();
        }
        
        this.saveGame();
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
        
        // Adicionar event listeners para posicionar cursor no final dos inputs
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                // Para inputs do tipo 'number', apenas focar no campo
                // setSelectionRange não é suportado em inputs do tipo 'number'
                if (this.type === 'number') {
                    // Apenas garantir que o campo está focado
                    this.focus();
                } else {
                    // Para outros tipos de input, posicionar cursor no final
                    setTimeout(() => {
                        this.setSelectionRange(this.value.length, this.value.length);
                    }, 0);
                }
            });
        });
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
        // Buscar a cartela pelo ID exato (sem conversão para número)
        const index = this.cards.findIndex(c => c.id === cardId);
        
        if (index !== -1) {
            if (confirm(`Excluir cartela #${cardId}?`)) {
                // Remover a cartela do array
                this.cards.splice(index, 1);
                
                // Salvar o estado do jogo
                this.saveGame();
                
                // Atualizar a interface
                this.renderCards();
                
                // Mostrar notificação de sucesso
                this.showNotification('Sucesso', `Cartela #${cardId} excluída com sucesso!`);
            }
        } else {
            this.showNotification('Erro', 'Cartela não encontrada!');
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
        
        // Usar onclick diretamente para garantir que funcione
        editBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showManualCardModal(card);
            return false;
        };
        
        // Usar onclick diretamente para garantir que funcione
        deleteBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.deleteCard(card.id);
            return false;
        };
        
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

    // Settings functionality
    initSettings() {
        // Load settings from localStorage
        this.settings = {
            autoMark: localStorage.getItem('bingo-auto-mark') === 'true',
            soundEffects: localStorage.getItem('bingo-sound-effects') === 'true',
            animations: localStorage.getItem('bingo-animations') !== 'false' // default true
        };
        
        // Update status displays
        this.updateSettingsStatus();
    }

    initSettingsMenu() {
        // Desktop settings menu
        const settingsMenu = document.getElementById('settings-menu');
        const settingsDropdown = document.getElementById('settings-dropdown-content');
        
        if (settingsMenu && settingsDropdown) {
            settingsMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSettingsDropdown(settingsMenu, settingsDropdown);
            });
        }

        // Mobile settings menu
        const mobileSettingsMenu = document.getElementById('mobile-settings-menu');
        const mobileSettingsDropdown = document.getElementById('mobile-settings-dropdown-content');
        
        if (mobileSettingsMenu && mobileSettingsDropdown) {
            mobileSettingsMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSettingsDropdown(mobileSettingsMenu, mobileSettingsDropdown);
            });
        }

        // Settings options event listeners
        document.querySelectorAll('.settings-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = option.dataset.action;
                this.handleSettingAction(action);
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            this.closeAllSettingsDropdowns();
        });
    }

    toggleSettingsDropdown(trigger, dropdown) {
        const isOpen = dropdown.classList.contains('show');
        
        // Close all dropdowns first
        this.closeAllSettingsDropdowns();
        
        if (!isOpen) {
            trigger.classList.add('active');
            dropdown.classList.add('show');
        }
    }

    closeAllSettingsDropdowns() {
        document.querySelectorAll('.settings-trigger').forEach(trigger => {
            trigger.classList.remove('active');
        });
        document.querySelectorAll('.settings-dropdown-content').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }

    handleSettingAction(action) {
        switch (action) {
            case 'auto-mark':
                this.toggleAutoMark();
                break;
            case 'sound-effects':
                this.toggleSoundEffects();
                break;
            case 'animations':
                this.toggleAnimations();
                break;
            case 'export-data':
                this.exportGameData();
                break;
        }
        
        // Close dropdowns after action
        this.closeAllSettingsDropdowns();
    }

    toggleAutoMark() {
        this.settings.autoMark = !this.settings.autoMark;
        localStorage.setItem('bingo-auto-mark', this.settings.autoMark.toString());
        this.updateSettingsStatus();
        
        this.showNotification(
            this.settings.autoMark ? 'Marcação automática ativada' : 'Marcação automática desativada',
            this.settings.autoMark ? 'success' : 'info'
        );
    }

    toggleSoundEffects() {
        this.settings.soundEffects = !this.settings.soundEffects;
        localStorage.setItem('bingo-sound-effects', this.settings.soundEffects.toString());
        this.updateSettingsStatus();
        
        this.showNotification(
            this.settings.soundEffects ? 'Efeitos sonoros ativados' : 'Efeitos sonoros desativados',
            this.settings.soundEffects ? 'success' : 'info'
        );
    }

    toggleAnimations() {
        this.settings.animations = !this.settings.animations;
        localStorage.setItem('bingo-animations', this.settings.animations.toString());
        this.updateSettingsStatus();
        
        // Apply/remove animations class to body
        document.body.classList.toggle('no-animations', !this.settings.animations);
        
        this.showNotification(
            this.settings.animations ? 'Animações ativadas' : 'Animações desativadas',
            this.settings.animations ? 'success' : 'info'
        );
    }

    exportGameData() {
        const gameData = {
            cards: this.cards,
            drawnNumbers: this.drawnNumbers,
            maxNumber: this.maxNumber,
            bingoType: this.bingoType,
            sortMode: this.sortMode,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(gameData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `bingo-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showNotification('Dados exportados com sucesso!', 'success');
    }

    updateSettingsStatus() {
        // Update desktop status
        const autoMarkStatus = document.getElementById('auto-mark-status');
        const soundEffectsStatus = document.getElementById('sound-effects-status');
        const animationsStatus = document.getElementById('animations-status');
        
        if (autoMarkStatus) {
            autoMarkStatus.textContent = this.settings.autoMark ? 'Ativado' : 'Desativado';
            autoMarkStatus.classList.toggle('active', this.settings.autoMark);
        }
        
        if (soundEffectsStatus) {
            soundEffectsStatus.textContent = this.settings.soundEffects ? 'Ativado' : 'Desativado';
            soundEffectsStatus.classList.toggle('active', this.settings.soundEffects);
        }
        
        if (animationsStatus) {
            animationsStatus.textContent = this.settings.animations ? 'Ativado' : 'Desativado';
            animationsStatus.classList.toggle('active', this.settings.animations);
        }

        // Update mobile status
        const mobileAutoMarkStatus = document.getElementById('mobile-auto-mark-status');
        const mobileSoundEffectsStatus = document.getElementById('mobile-sound-effects-status');
        const mobileAnimationsStatus = document.getElementById('mobile-animations-status');
        
        if (mobileAutoMarkStatus) {
            mobileAutoMarkStatus.textContent = this.settings.autoMark ? 'Ativado' : 'Desativado';
            mobileAutoMarkStatus.classList.toggle('active', this.settings.autoMark);
        }
        
        if (mobileSoundEffectsStatus) {
            mobileSoundEffectsStatus.textContent = this.settings.soundEffects ? 'Ativado' : 'Desativado';
            mobileSoundEffectsStatus.classList.toggle('active', this.settings.soundEffects);
        }
        
        if (mobileAnimationsStatus) {
            mobileAnimationsStatus.textContent = this.settings.animations ? 'Ativado' : 'Desativado';
            mobileAnimationsStatus.classList.toggle('active', this.settings.animations);
        }
    }
}

// Inicializar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    const game = new BingoGame();
});

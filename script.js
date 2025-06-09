// Classe para representar uma cartela de bingo
class BingoCard {
    constructor(id) {
        this.id = id;
        this.numbers = this.generateCard();
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
        this.availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1); // Números de 1 a 75
        
        // Inicializar elementos da UI
        this.initUI();
        
        // Carregar dados salvos
        this.loadGame();
        
        // Renderizar o estado inicial
        this.renderGame();
    }

    initUI() {
        // Botões e inputs
        document.getElementById('add-card').addEventListener('click', () => this.addCard());
        document.getElementById('mark-number').addEventListener('click', () => this.markManualNumber());
        document.getElementById('draw-random').addEventListener('click', () => this.drawRandomNumber());
        document.getElementById('reset-game').addEventListener('click', () => this.resetGame());
        document.getElementById('notification-close').addEventListener('click', () => this.hideNotification());
        
        // Permitir pressionar Enter no input de número
        document.getElementById('drawn-number').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.markManualNumber();
            }
        });
        
        // Permitir pressionar Enter no input de ID da cartela
        document.getElementById('card-id').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addCard();
            }
        });
    }

    addCard() {
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

    markManualNumber() {
        const numberInput = document.getElementById('drawn-number');
        const numberValue = parseInt(numberInput.value);
        
        if (isNaN(numberValue) || numberValue < 1 || numberValue > 75) {
            this.showNotification('Erro', 'Por favor, informe um número válido entre 1 e 75.');
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

    resetGame() {
        if (confirm('Deseja reiniciar o jogo? Isso manterá as cartelas, mas limpará os números sorteados.')) {
            this.drawnNumbers = [];
            this.availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
            
            // Salvar e renderizar
            this.saveGame();
            this.renderGame();
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
        
        // Ordenar números para melhor visualização
        const sortedNumbers = [...this.drawnNumbers].sort((a, b) => a - b);
        
        for (const number of sortedNumbers) {
            const numberElement = document.createElement('div');
            numberElement.className = 'drawn-number';
            numberElement.textContent = number;
            drawnNumbersContainer.appendChild(numberElement);
        }
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
            drawnNumbers: this.drawnNumbers
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
                
                // Atualizar números disponíveis
                this.availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1)
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
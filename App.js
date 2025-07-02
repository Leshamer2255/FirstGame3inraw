import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, Animated, Button } from 'react-native';

const BOARD_SIZE = 6;
const EMOJIS = ['₿', 'Ξ', '🪙', '🐕', '◎', '₳'];
const BONUS = '🚀';
const SUPER_BONUS = '💥';
const CROSS_BONUS = '💣';
const ANIMATION_DURATION = 350;

const LEVELS = [
  { time: 60, target: 600 },
  { time: 50, target: 900 },
  { time: 40, target: 1300 },
  { time: 35, target: 1800 },
  { time: 30, target: 2500 },
];

const INITIAL_LIVES = 3;

// Додаю місії для кожного рівня
const MISSIONS = [
  { symbol: '🪙', name: 'Coin', count: 8 },
  { symbol: '🐕', name: 'Dogecoin', count: 10 },
  { symbol: '◎', name: 'Solana', count: 12 },
  { symbol: '⚡', name: 'Lightning', count: 9 },
  { symbol: '🌙', name: 'Mooncoin', count: 11 },
  { symbol: '🔥', name: 'Firecoin', count: 13 },
  { symbol: '₿', name: 'Bitcoin', count: 15 },
  { symbol: 'Ξ', name: 'Ethereum', count: 14 },
  { symbol: '💎', name: 'Diamond', count: 16 },
  { symbol: '🚀', name: 'Rocket', count: 17 },
];

const ALL_TOKENS = ['₿', 'Ξ', '🪙', '🐕', '◎', '₳', '⚡', '🌙', '🔥', '💎', '🚀', '🎯', '⭐', '🌟', '💫', '🌍', '🌊', '🌪️', '🌈', '🎪'];

// Початкові монети (більше варіацій для цікавої гри)
const INITIAL_AVAILABLE_TOKENS = ['🪙', '🐕', '◎', '⚡', '🌙', '🔥'];

// Додаю систему магазину монет
const COIN_SHOP = [
  { symbol: '₿', name: 'Bitcoin', price: 1500, description: 'Король криптовалют' },
  { symbol: 'Ξ', name: 'Ethereum', price: 1200, description: 'Смарт-контракти' },
  { symbol: '🪙', name: 'Coin', price: 0, description: 'Базова монета', owned: true },
  { symbol: '🐕', name: 'Dogecoin', price: 0, description: 'Мем-монета', owned: true },
  { symbol: '◎', name: 'Solana', price: 0, description: 'Швидкі транзакції', owned: true },
  { symbol: '₳', name: 'Cardano', price: 1000, description: 'Науковий підхід' },
  { symbol: '⚡', name: 'Lightning', price: 0, description: 'Швидкі платежі', owned: true },
  { symbol: '🌙', name: 'Mooncoin', price: 0, description: 'До місяця!', owned: true },
  { symbol: '🔥', name: 'Firecoin', price: 0, description: 'Гаряча монета', owned: true },
  { symbol: '💎', name: 'Diamond', price: 2000, description: 'Дорогоцінний камінь' },
  { symbol: '🚀', name: 'Rocket', price: 1800, description: 'До зірок!' },
  { symbol: '🎯', name: 'Target', price: 1600, description: 'Точна ціль' },
  { symbol: '⭐', name: 'Starcoin', price: 1400, description: 'Зіркова монета' },
  { symbol: '🌟', name: 'Sparkle', price: 1300, description: 'Блискуча' },
  { symbol: '💫', name: 'Shooting', price: 1700, description: 'Падаюча зірка' },
  { symbol: '🌍', name: 'Earth', price: 1100, description: 'Планетарна' },
  { symbol: '🌊', name: 'Wave', price: 900, description: 'Хвиляста' },
  { symbol: '🌪️', name: 'Tornado', price: 1900, description: 'Буревій' },
  { symbol: '🌈', name: 'Rainbow', price: 2200, description: 'Веселкова' },
  { symbol: '🎪', name: 'Circus', price: 2500, description: 'Циркова' },
];

// Різні налаштування для режимів гри
const GAME_MODES = {
  campaign: {
    name: 'Кампанія',
    description: 'Проходь рівні та виконуй місії',
    lives: 3,
    hasMissions: true,
    hasTimer: true,
    hasLevels: true,
    startingTokens: ['🪙', '🐕', '◎', '⚡', '🌙', '🔥'],
    shopAvailable: true,
  },
  classic: {
    name: 'Класичний',
    description: 'Безмежна гра без обмежень',
    lives: 999,
    hasMissions: false,
    hasTimer: false,
    hasLevels: false,
    startingTokens: ['🪙', '🐕', '◎', '⚡', '🌙', '🔥', '💎', '🚀'],
    shopAvailable: true,
  },
  challenge: {
    name: 'Челендж',
    description: '60 секунд на максимум очок!',
    lives: 1,
    hasMissions: false,
    hasTimer: true,
    hasLevels: false,
    startingTokens: ['🪙', '🐕', '◎', '⚡', '🌙', '🔥', '💎', '🚀', '🎯', '⭐'],
    shopAvailable: false,
    timeLimit: 60,
  },
  speedrun: {
    name: 'Спідран',
    description: 'Швидкі матчі = більше часу!',
    lives: 3,
    hasMissions: false,
    hasTimer: true,
    hasLevels: false,
    startingTokens: ['🪙', '🐕', '◎', '⚡', '🌙', '🔥'],
    shopAvailable: false,
    timeLimit: 30,
    timeBonus: true,
  },
  puzzle: {
    name: 'Пазл',
    description: 'Обмежена кількість ходів',
    lives: 3,
    hasMissions: false,
    hasTimer: false,
    hasLevels: false,
    startingTokens: ['🪙', '🐕', '◎', '⚡', '🌙', '🔥'],
    shopAvailable: false,
    moveLimit: 20,
  },
};

export default function App() {
  const [availableTokens, setAvailableTokens] = useState(INITIAL_AVAILABLE_TOKENS); // Доступні монети для гри
  const [showShop, setShowShop] = useState(false);

  // Функція для отримання випадкової монети (тепер всередині компонента)
  const getRandomEmoji = () => {
    return availableTokens[Math.floor(Math.random() * availableTokens.length)];
  };

  // Функція генерації дошки (тепер всередині компонента)
  const generateBoard = () => {
    return Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, getRandomEmoji)
    );
  };

  // Початкова дошка з різними монетами
  const [board, setBoard] = useState(() => 
    Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => 
        INITIAL_AVAILABLE_TOKENS[Math.floor(Math.random() * INITIAL_AVAILABLE_TOKENS.length)]
      )
    )
  );
  const [selected, setSelected] = useState(null); // [row, col]
  const [matches, setMatches] = useState(null); // матриця true/false для анімації
  const [bonuses, setBonuses] = useState([]); // [{type, row, col}]
  const [isAnimating, setIsAnimating] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [timer, setTimer] = useState(LEVELS[0].time);
  const [targetScore, setTargetScore] = useState(LEVELS[0].target);
  const [gameOver, setGameOver] = useState(false);
  const [levelCompleted, setLevelCompleted] = useState(false);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const opacityAnim = useRef(
    Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => new Animated.Value(1))
    )
  ).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [missionProgress, setMissionProgress] = useState(0);
  const [hint, setHint] = useState(null); // [[r1, c1], [r2, c2]]
  const hintAnim = useRef(new Animated.Value(1)).current;
  const hintTimer = useRef(null);
  const hintAnimation = useRef(null);
  const [wallet, setWallet] = useState(() => {
    const obj = {};
    ALL_TOKENS.forEach(t => obj[t] = 0);
    return obj;
  });
  const [showWallet, setShowWallet] = useState(false);
  const [tokenPrices, setTokenPrices] = useState(() => {
    const obj = {};
    ALL_TOKENS.forEach(t => obj[t] = getRandomPrice());
    return obj;
  });
  const [screen, setScreen] = useState('main'); // main, gameMode, game, wallet, upgrades, shop
  const [gameMode, setGameMode] = useState('campaign'); // campaign, classic, challenge, speedrun, puzzle
  const [movesLeft, setMovesLeft] = useState(20); // Для режиму пазл
  const [timeBonus, setTimeBonus] = useState(0); // Для режиму спідран
  const [earnedCoins, setEarnedCoins] = useState({}); // Монети, зароблені за рівень
  const [noMovesAvailable, setNoMovesAvailable] = useState(false); // Немає можливих ходів

  function cloneBoard(board) {
    return board.map(row => [...row]);
  }

  function areAdjacent([r1, c1], [r2, c2]) {
    return (
      (Math.abs(r1 - r2) === 1 && c1 === c2) ||
      (Math.abs(c1 - c2) === 1 && r1 === r2)
    );
  }

  // Пошук матчів і бонусів + підрахунок очок
  function findMatches(board) {
    const matches = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));
    const bonuses = [];
    const matchGroups = [];
    const bonusTypes = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

    // Horizontal
    for (let row = 0; row < BOARD_SIZE; row++) {
      let count = 1;
      for (let col = 1; col < BOARD_SIZE; col++) {
        if (board[row][col] && board[row][col] === board[row][col - 1]) {
          count++;
        } else {
          if (count >= 3) {
            const group = [];
            for (let k = 0; k < count; k++) {
              matches[row][col - 1 - k] = true;
              group.push([row, col - 1 - k]);
            }
            matchGroups.push({ type: 'row', count, cells: group, value: board[row][col - 1] });
            if (count === 4) {
              const bonusCol = col - 1 - Math.floor(Math.random() * count);
              bonuses.push({ type: 'row', row, col: bonusCol, bonusType: BONUS });
              bonusTypes[row][bonusCol] = BONUS;
            }
            if (count >= 5) {
              const bonusCol = col - 1 - Math.floor(Math.random() * count);
              bonuses.push({ type: 'row', row, col: bonusCol, bonusType: SUPER_BONUS, color: board[row][col - 1] });
              bonusTypes[row][bonusCol] = SUPER_BONUS;
            }
          }
          count = 1;
        }
      }
      if (count >= 3) {
        const group = [];
        for (let k = 0; k < count; k++) {
          matches[row][BOARD_SIZE - 1 - k] = true;
          group.push([row, BOARD_SIZE - 1 - k]);
        }
        matchGroups.push({ type: 'row', count, cells: group, value: board[row][BOARD_SIZE - 1] });
        if (count === 4) {
          const bonusCol = BOARD_SIZE - 1 - Math.floor(Math.random() * count);
          bonuses.push({ type: 'row', row, col: bonusCol, bonusType: BONUS });
          bonusTypes[row][bonusCol] = BONUS;
        }
        if (count >= 5) {
          const bonusCol = BOARD_SIZE - 1 - Math.floor(Math.random() * count);
          bonuses.push({ type: 'row', row, col: bonusCol, bonusType: SUPER_BONUS, color: board[row][BOARD_SIZE - 1] });
          bonusTypes[row][bonusCol] = SUPER_BONUS;
        }
      }
    }

    // Vertical
    for (let col = 0; col < BOARD_SIZE; col++) {
      let count = 1;
      for (let row = 1; row < BOARD_SIZE; row++) {
        if (board[row][col] && board[row][col] === board[row - 1][col]) {
          count++;
        } else {
          if (count >= 3) {
            const group = [];
            for (let k = 0; k < count; k++) {
              matches[row - 1 - k][col] = true;
              group.push([row - 1 - k, col]);
            }
            matchGroups.push({ type: 'col', count, cells: group, value: board[row - 1][col] });
            if (count === 4) {
              const bonusRow = row - 1 - Math.floor(Math.random() * count);
              bonuses.push({ type: 'col', row: bonusRow, col, bonusType: BONUS });
              bonusTypes[bonusRow][col] = BONUS;
            }
            if (count >= 5) {
              const bonusRow = row - 1 - Math.floor(Math.random() * count);
              bonuses.push({ type: 'col', row: bonusRow, col, bonusType: SUPER_BONUS, color: board[row - 1][col] });
              bonusTypes[bonusRow][col] = SUPER_BONUS;
            }
          }
          count = 1;
        }
      }
      if (count >= 3) {
        const group = [];
        for (let k = 0; k < count; k++) {
          matches[BOARD_SIZE - 1 - k][col] = true;
          group.push([BOARD_SIZE - 1 - k, col]);
        }
        matchGroups.push({ type: 'col', count, cells: group, value: board[BOARD_SIZE - 1][col] });
        if (count === 4) {
          const bonusRow = BOARD_SIZE - 1 - Math.floor(Math.random() * count);
          bonuses.push({ type: 'col', row: bonusRow, col, bonusType: BONUS });
          bonusTypes[bonusRow][col] = BONUS;
        }
        if (count >= 5) {
          const bonusRow = BOARD_SIZE - 1 - Math.floor(Math.random() * count);
          bonuses.push({ type: 'col', row: bonusRow, col, bonusType: SUPER_BONUS, color: board[BOARD_SIZE - 1][col] });
          bonusTypes[bonusRow][col] = SUPER_BONUS;
        }
      }
    }

    // L/T-образний матч (хрестова бомба)
    // Перебираємо всі клітинки, шукаємо перетин двох матчів
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (matches[row][col]) {
          // Перевіряємо чи ця клітинка входить і в горизонтальний, і у вертикальний матч
          let inRow = false, inCol = false;
          for (const group of matchGroups) {
            if (group.cells.some(([r, c]) => r === row && c === col)) {
              if (group.type === 'row' && group.count >= 3) inRow = true;
              if (group.type === 'col' && group.count >= 3) inCol = true;
            }
          }
          if (inRow && inCol) {
            bonuses.push({ type: 'cross', row, col, bonusType: CROSS_BONUS });
            bonusTypes[row][col] = CROSS_BONUS;
          }
        }
      }
    }

    return { matches, bonuses, matchGroups, bonusTypes };
  }

  function removeMatchesAndDrop(board, matches, bonusesToPlace = []) {
    let newBoard = cloneBoard(board);
    // Remove matches
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (matches[row][col]) {
          newBoard[row][col] = null;
        }
      }
    }
    // Place bonuses
    for (const bonus of bonusesToPlace) {
      if (newBoard[bonus.row][bonus.col] === null) {
        newBoard[bonus.row][bonus.col] = bonus.bonusType;
      }
    }
    // Drop
    for (let col = 0; col < BOARD_SIZE; col++) {
      let pointer = BOARD_SIZE - 1;
      for (let row = BOARD_SIZE - 1; row >= 0; row--) {
        if (newBoard[row][col]) {
          newBoard[pointer][col] = newBoard[row][col];
          if (pointer !== row) newBoard[row][col] = null;
          pointer--;
        }
      }
      // Fill empty
      for (let row = pointer; row >= 0; row--) {
        newBoard[row][col] = getRandomEmoji();
      }
    }
    return newBoard;
  }

  function hasAnyMatches(matches) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (matches[row][col]) return true;
      }
    }
    return false;
  }

  function activateBonus(board, bonus, colorForSuper) {
    let newBoard = cloneBoard(board);
    if (bonus.bonusType === BONUS) {
      // Стандартний бонус: зносить ряд або стовпець
      if (bonus.type === 'row') {
        for (let col = 0; col < BOARD_SIZE; col++) {
          newBoard[bonus.row][col] = null;
        }
      } else if (bonus.type === 'col') {
        for (let row = 0; row < BOARD_SIZE; row++) {
          newBoard[row][bonus.col] = null;
        }
      }
    } else if (bonus.bonusType === SUPER_BONUS) {
      // Супербомба: зносить всі фішки такого ж кольору
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (board[row][col] === colorForSuper) {
            newBoard[row][col] = null;
          }
        }
      }
    } else if (bonus.bonusType === CROSS_BONUS) {
      // Хрестова бомба: зносить ряд і стовпець
      for (let col = 0; col < BOARD_SIZE; col++) {
        newBoard[bonus.row][col] = null;
      }
      for (let row = 0; row < BOARD_SIZE; row++) {
        newBoard[row][bonus.col] = null;
      }
    }
    return newBoard;
  }

  function getBonusMatches(board, bonus, colorForSuper) {
    const matches = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));
    if (bonus.bonusType === BONUS) {
      if (bonus.type === 'row') {
        for (let col = 0; col < BOARD_SIZE; col++) {
          matches[bonus.row][col] = true;
        }
      } else if (bonus.type === 'col') {
        for (let row = 0; row < BOARD_SIZE; row++) {
          matches[row][bonus.col] = true;
        }
      }
    } else if (bonus.bonusType === SUPER_BONUS) {
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (board[row][col] === colorForSuper) {
            matches[row][col] = true;
          }
        }
      }
    } else if (bonus.bonusType === CROSS_BONUS) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        matches[bonus.row][col] = true;
      }
      for (let row = 0; row < BOARD_SIZE; row++) {
        matches[row][bonus.col] = true;
      }
    }
    return matches;
  }

  function findPossibleMove(board) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        // Check swap with right neighbor
        if (c < BOARD_SIZE - 1) {
          const newBoard = cloneBoard(board);
          [newBoard[r][c], newBoard[r][c + 1]] = [newBoard[r][c + 1], newBoard[r][c]];
          if (hasAnyMatches(findMatches(newBoard).matches)) {
            return [[r, c], [r, c + 1]];
          }
        }
        // Check swap with bottom neighbor
        if (r < BOARD_SIZE - 1) {
          const newBoard = cloneBoard(board);
          [newBoard[r][c], newBoard[r + 1][c]] = [newBoard[r + 1][c], newBoard[r][c]];
          if (hasAnyMatches(findMatches(newBoard).matches)) {
            return [[r, c], [r + 1, c]];
          }
        }
      }
    }
    return null; // No possible moves
  }

  function getRandomPrice() {
    // Віртуальна ціна для кожної монети (рандомно)
    return (Math.random() * 10000 + 10).toFixed(2);
  }

  // Таймер
  useEffect(() => {
    if (gameOver || levelCompleted) return;
    
    const mode = GAME_MODES[gameMode];
    
    if (mode.hasTimer && timer <= 0) {
      // Для режимів з таймером
      if (mode.hasLevels) {
        // Кампанія: перевіряємо ціль
        if (score < targetScore) {
          if (lives > 1) {
            setLives(l => l - 1);
            setTimer(mode.timeLimit || LEVELS[level].time);
            setScore(0);
            setBoard(generateBoard());
            setSelected(null);
            setMatches(null);
            setBonuses([]);
          } else {
            setLives(0);
            setGameOver(true);
          }
        } else {
          setGameOver(true);
        }
      } else {
        // Інші режими з таймером: просто закінчуємо гру
        setGameOver(true);
      }
      return;
    }
    
    // Для режиму пазл: перевіряємо ходи
    if (mode.moveLimit && movesLeft <= 0) {
      if (score >= targetScore) {
        setLevelCompleted(true);
      } else {
        setGameOver(true);
      }
      return;
    }
    
    if (mode.hasTimer) {
      const interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, gameOver, levelCompleted, score, targetScore, lives, level, gameMode, movesLeft]);

  // Перевірка на проходження рівня
  useEffect(() => {
    const mode = GAME_MODES[gameMode];
    
    if (mode.hasLevels && !levelCompleted && score >= targetScore) {
      // Для кампанії: перевіряємо і місію
      if (mode.hasMissions) {
        const mission = MISSIONS[level % MISSIONS.length];
        if (missionProgress >= mission.count) {
          setLevelCompleted(true);
        }
      } else {
        setLevelCompleted(true);
      }
    } else if (!mode.hasLevels && score >= targetScore) {
      // Для інших режимів: просто досягнення цілі
      setLevelCompleted(true);
    }
  }, [score, targetScore, levelCompleted, level, gameMode, missionProgress]);

  // Очищення стартових матчів
  useEffect(() => {
    let b = board;
    let { matches: m, bonuses: bs, matchGroups: mg } = findMatches(b);
    while (hasAnyMatches(m)) {
      let points = 0;
      for (const group of mg) {
        if (group.count === 3) points += 10 * 3;
        else if (group.count >= 4) points += 20 * group.count;
      }
      setScore(s => s + points);
      b = removeMatchesAndDrop(b, m, bs);
      const res = findMatches(b);
      m = res.matches;
      bs = res.bonuses;
      mg = res.matchGroups;
    }
    setBoard(b);
    // eslint-disable-next-line
  }, []);

  // Анімація зникнення
  useEffect(() => {
    if (!matches) return;
    setIsAnimating(true);
    const animations = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (matches[row][col]) {
          animations.push(
            Animated.timing(opacityAnim[row][col], {
              toValue: 0,
              duration: ANIMATION_DURATION,
              useNativeDriver: true,
            })
          );
        }
      }
    }
    Animated.parallel(animations).start(() => {
      let points = 0;
      if (matches && matches.length) {
        let { matchGroups } = findMatches(board);
        for (const group of matchGroups) {
          if (group.count === 3) points += 10 * 3;
          else if (group.count >= 4) points += 20 * group.count;
        }
      }
      setScore(s => s + points);
      let newBoard = removeMatchesAndDrop(board, matches, bonuses);
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          opacityAnim[row][col].setValue(1);
        }
      }
      if (bonuses.length > 0) {
        let tempBoard = newBoard;
        let bonusMatches = null;
        let bonusIndex = 0;
        function activateNextBonus() {
          if (bonusIndex >= bonuses.length) {
            const res = findMatches(tempBoard);
            if (hasAnyMatches(res.matches)) {
              setBoard(tempBoard);
              setMatches(res.matches);
              setBonuses(res.bonuses);
            } else {
              setBoard(tempBoard);
              setMatches(null);
              setBonuses([]);
              setIsAnimating(false);
            }
            return;
          }
          const bonus = bonuses[bonusIndex];
          bonusMatches = getBonusMatches(tempBoard, bonus, bonus.color);
          let collectedFromBonus = 0;
          for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
              if (bonusMatches[row][col] && tempBoard[row][col] === MISSIONS[level % MISSIONS.length].symbol) {
                collectedFromBonus++;
              }
            }
          }
          if (collectedFromBonus > 0) setMissionProgress(p => p + collectedFromBonus);
          let bonusPoints = 0;
          for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
              if (bonusMatches[row][col]) bonusPoints += 50;
            }
          }
          setScore(s => s + bonusPoints);
          const bonusAnims = [];
          for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
              if (bonusMatches[row][col]) {
                bonusAnims.push(
                  Animated.timing(opacityAnim[row][col], {
                    toValue: 0,
                    duration: ANIMATION_DURATION,
                    useNativeDriver: true,
                  })
                );
              }
            }
          }
          Animated.parallel(bonusAnims).start(() => {
            tempBoard = activateBonus(tempBoard, bonus, bonus.color);
            for (let row = 0; row < BOARD_SIZE; row++) {
              for (let col = 0; col < BOARD_SIZE; col++) {
                if (bonusMatches[row][col]) {
                  opacityAnim[row][col].setValue(1);
                }
              }
            }
            tempBoard = removeMatchesAndDrop(tempBoard, bonusMatches);
            bonusIndex++;
            activateNextBonus();
          });
        }
        activateNextBonus();
      } else {
        const res = findMatches(newBoard);
        if (hasAnyMatches(res.matches)) {
          setBoard(newBoard);
          setMatches(res.matches);
          setBonuses(res.bonuses);
        } else {
          setBoard(newBoard);
          setMatches(null);
          setBonuses([]);
          setIsAnimating(false);
        }
      }
    });
    // eslint-disable-next-line
  }, [matches]);

  // Анімація появи/зникнення оверлею рівня
  useEffect(() => {
    if (levelCompleted && !gameOver) {
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [levelCompleted, gameOver]);

  // Оновлюємо прогрес місії при кожному матчі
  useEffect(() => {
    if (!matches) return;
    const mission = MISSIONS[level % MISSIONS.length];
    let collected = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (matches[row][col] && board[row][col] === mission.symbol) {
          collected++;
        }
      }
    }
    if (collected > 0) setMissionProgress(p => p + collected);
  }, [matches]);

  // Скидаємо прогрес місії при старті/рестарті рівня
  useEffect(() => {
    setMissionProgress(0);
  }, [level, gameOver]);

  // Перевірка на проходження рівня: і очки, і місія
  useEffect(() => {
    const mission = MISSIONS[level % MISSIONS.length];
    if (!levelCompleted && score >= targetScore && missionProgress >= mission.count) {
      setLevelCompleted(true);
    }
  }, [score, targetScore, missionProgress, levelCompleted, level]);

  // Таймер підказок
  useEffect(() => {
    const stopHintTimer = () => {
      if (hintTimer.current) clearTimeout(hintTimer.current);
      setHint(null);
    };

    if (!isAnimating && !gameOver && !levelCompleted) {
      hintTimer.current = setTimeout(() => {
        const move = findPossibleMove(board);
        if (move) {
          setHint(move);
          setNoMovesAvailable(false);
        } else {
          setNoMovesAvailable(true);
          setHint(null);
        }
      }, 3000); // 3 секунди
    } else {
      stopHintTimer();
      setNoMovesAvailable(false);
    }

    return stopHintTimer;
  }, [isAnimating, gameOver, levelCompleted, board]);

  // Анімація підказки
  useEffect(() => {
    if (hint) {
      hintAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(hintAnim, { toValue: 1.2, duration: 400, useNativeDriver: true }),
          Animated.timing(hintAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      );
      hintAnimation.current.start();
    } else {
      if (hintAnimation.current) {
        hintAnimation.current.stop();
      }
      hintAnim.setValue(1);
    }
  }, [hint]);

  // Після проходження рівня — додаємо монети у гаманець і показуємо гаманець
  useEffect(() => {
    if (levelCompleted && !showWallet) {
      const mission = MISSIONS[level % MISSIONS.length];
      const earned = {};
      
      // Додаємо монети з місії
      if (GAME_MODES[gameMode].hasMissions) {
        earned[mission.symbol] = mission.count;
        setWallet(w => ({ ...w, [mission.symbol]: w[mission.symbol] + mission.count }));
      }
      
      // Додаємо монети з гри (за матчі)
      const totalEarned = Math.floor(score / 100); // Кожні 100 очок = 1 монета
      if (totalEarned > 0) {
        const randomToken = availableTokens[Math.floor(Math.random() * availableTokens.length)];
        earned[randomToken] = (earned[randomToken] || 0) + totalEarned;
        setWallet(w => ({ ...w, [randomToken]: w[randomToken] + totalEarned }));
      }
      
      setEarnedCoins(earned);
      
      setTokenPrices(prices => {
        const obj = {};
        ALL_TOKENS.forEach(t => obj[t] = getRandomPrice());
        return obj;
      });
      setTimeout(() => setShowWallet(true), 800);
    }
  }, [levelCompleted]);

  // При переході на наступний рівень ховаємо гаманець
  useEffect(() => {
    setShowWallet(false);
  }, [level]);

  // Оновлюємо дошку коли змінюються доступні монети
  useEffect(() => {
    if (availableTokens.length > 0) {
      setBoard(generateBoard());
    }
  }, [availableTokens]);

  // Додаю кнопку "Далі" для переходу до наступного рівня
  const handleNextLevel = () => {
    setShowWallet(false);
    setLevelCompleted(false);
    setEarnedCoins({}); // Скидаємо зароблені монети
    setNoMovesAvailable(false); // Скидаємо стан "немає ходів"
    
    const nextLevel = level + 1;
    if (gameMode === 'classic') {
      // Класичний режим: ціль зростає
      setTargetScore(t => t + 200);
    } else if (gameMode === 'campaign') {
      if (nextLevel < LEVELS.length) {
        setTargetScore(LEVELS[nextLevel].target);
      } else {
        setGameOver(true);
        setScreen('main');
        return;
      }
    }
    setLevel(nextLevel);
    setTimer(LEVELS[nextLevel].time + 5 * nextLevel);
    setScore(0);
    setBoard(generateBoard());
    setSelected(null);
    setMatches(null);
    setBonuses([]);
    setGameOver(false);
    setLives(INITIAL_LIVES);
    setMissionProgress(0);
    setScreen('game');
  };

  const handleCellPress = (row, col) => {
    if (isAnimating || gameOver || levelCompleted) return;
    
    const mode = GAME_MODES[gameMode];
    
    // Перевіряємо ліміт ходів для режиму пазл
    if (mode.moveLimit && movesLeft <= 0) return;
    
    if (!selected) {
      setSelected([row, col]);
      return;
    }
    const [selRow, selCol] = selected;
    if (selRow === row && selCol === col) {
      setSelected(null);
      return;
    }
    if (!areAdjacent([selRow, selCol], [row, col])) {
      setSelected([row, col]);
      return;
    }
    let newBoard = cloneBoard(board);
    [newBoard[selRow][selCol], newBoard[row][col]] = [newBoard[row][col], newBoard[selRow][selCol]];
    let { matches: foundMatches, bonuses: foundBonuses, matchGroups: foundGroups } = findMatches(newBoard);
    if (hasAnyMatches(foundMatches)) {
      setHint(null); // Скидаємо підказку
      setNoMovesAvailable(false); // Скидаємо стан "немає ходів"
      setBoard(newBoard);
      setMatches(foundMatches);
      setBonuses(foundBonuses);
      
      // Зменшуємо кількість ходів для режиму пазл
      if (mode.moveLimit) {
        setMovesLeft(prev => prev - 1);
      }
      
      // Додаємо бонус часу для режиму спідран
      if (mode.timeBonus && foundMatches) {
        const matchCount = foundMatches.flat().filter(Boolean).length;
        if (matchCount >= 3) {
          setTimeBonus(prev => prev + 2);
          setTimer(prev => prev + 2);
        }
      }
    } else {
      setBoard(cloneBoard(board));
    }
    setSelected(null);
  };

  const handleRestart = () => {
    const mode = GAME_MODES[gameMode];
    
    setLevel(0);
    setScore(0);
    setBoard(generateBoard());
    setSelected(null);
    setMatches(null);
    setBonuses([]);
    setGameOver(false);
    setLevelCompleted(false);
    setMissionProgress(0);
    setMovesLeft(mode.moveLimit || 20);
    setTimeBonus(0);
    setEarnedCoins({}); // Скидаємо зароблені монети
    setShowWallet(false);
    setNoMovesAvailable(false); // Скидаємо стан "немає ходів"
    setHint(null); // Скидаємо підказку
    
    // Налаштування для різних режимів
    if (mode.hasTimer) {
      setTimer(mode.timeLimit || LEVELS[0].time);
    } else {
      setTimer(999999); // Безмежний час
    }
    
    if (mode.hasLevels) {
      setTargetScore(LEVELS[0].target);
    } else {
      setTargetScore(mode.timeLimit ? 99999 : 1000);
    }
    
    setLives(mode.lives);
    
    // Встановлюємо доступні монети для режиму
    setAvailableTokens(mode.startingTokens);
    
    setScreen('game');
  };

  // Функція покупки монети
  const buyCoin = (coinSymbol) => {
    const coin = COIN_SHOP.find(c => c.symbol === coinSymbol);
    if (!coin || coin.owned) return;
    
    const totalMoney = ALL_TOKENS.reduce((sum, t) => sum + wallet[t] * tokenPrices[t], 0);
    if (totalMoney >= coin.price) {
      // Розраховуємо скільки монет потрібно продати для покупки
      let remainingCost = coin.price;
      const newWallet = { ...wallet };
      
      // Продаємо монети по черзі, починаючи з найменш цінних
      const sortedTokens = ALL_TOKENS.sort((a, b) => tokenPrices[a] - tokenPrices[b]);
      
      for (const token of sortedTokens) {
        if (remainingCost <= 0) break;
        const tokenValue = newWallet[token] * tokenPrices[token];
        if (tokenValue > 0) {
          if (tokenValue >= remainingCost) {
            const tokensToSell = Math.ceil(remainingCost / tokenPrices[token]);
            newWallet[token] = Math.max(0, newWallet[token] - tokensToSell);
            remainingCost = 0;
          } else {
            remainingCost -= tokenValue;
            newWallet[token] = 0;
          }
        }
      }
      
      if (remainingCost <= 0) {
        setWallet(newWallet);
        setAvailableTokens(prev => [...prev, coinSymbol]);
        // Оновлюємо ціни після покупки
        setTokenPrices(prices => {
          const obj = {};
          ALL_TOKENS.forEach(t => obj[t] = getRandomPrice());
          return obj;
        });
        // Оновлюємо дошку з новою монетою
        setBoard(generateBoard());
      }
    }
  };

  // Відображення гаманця після рівня
  const renderWallet = () => (
    <View style={styles.walletOverlay}>
      <Text style={styles.walletTitle}>Нагороди за рівень!</Text>
      
      {Object.keys(earnedCoins).length > 0 ? (
        <>
          <View style={styles.earnedCoinsContainer}>
            {Object.entries(earnedCoins).map(([token, amount]) => (
              <View key={token} style={styles.earnedCoinItem}>
                <Text style={styles.earnedCoinSymbol}>{token}</Text>
                <Text style={styles.earnedCoinAmount}>+{amount}</Text>
                <Text style={styles.earnedCoinValue}>
                  ${(amount * tokenPrices[token]).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
          
          <Text style={styles.earnedTotal}>
            Загальна вартість: ${Object.entries(earnedCoins)
              .reduce((sum, [token, amount]) => sum + amount * tokenPrices[token], 0)
              .toFixed(2)}
          </Text>
        </>
      ) : (
        <Text style={styles.noEarnings}>Немає зароблених монет</Text>
      )}
      
      <View style={styles.walletButtons}>
        <TouchableOpacity style={styles.nextLevelButton} onPress={handleNextLevel}>
          <Text style={styles.nextLevelButtonText}>Наступний рівень</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.mainMenuButton} onPress={returnToMainMenu}>
          <Text style={styles.mainMenuButtonText}>Головне меню</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Екран вибору режиму
  const renderGameModeScreen = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.menuTitle}>Обери режим</Text>
      {Object.entries(GAME_MODES).map(([key, mode]) => (
        <TouchableOpacity 
          key={key} 
          style={styles.menuButton} 
          onPress={() => { 
            setGameMode(key); 
            handleRestart(); 
          }}
        >
          <Text style={styles.menuButtonText}>{mode.name}</Text>
          <Text style={styles.menuButtonDesc}>{mode.description}</Text>
        </TouchableOpacity>
      ))}
      <Button title="Назад" onPress={() => setScreen('main')} />
    </View>
  );

  // Головне меню
  const renderMainMenu = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.menuTitle}>Crypto Match</Text>
      <TouchableOpacity style={styles.menuButton} onPress={() => setScreen('gameMode')}>
        <Text style={styles.menuButtonText}>Грати</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuButton} onPress={() => setScreen('wallet')}>
        <Text style={styles.menuButtonText}>Гаманець</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuButton} onPress={() => setScreen('shop')}>
        <Text style={styles.menuButtonText}>Магазин монет</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuButton} onPress={() => setScreen('upgrades')}>
        <Text style={styles.menuButtonText}>Покращення</Text>
      </TouchableOpacity>
    </View>
  );

  // Екран гаманця (можна відкривати з меню)
  const renderWalletScreen = () => (
    <View style={styles.walletOverlay}>
      <Text style={styles.walletTitle}>Твій крипто-гаманець</Text>
      {ALL_TOKENS.map(token => (
        <View key={token} style={styles.walletRow}>
          <Text style={styles.walletToken}>{token}</Text>
          <Text style={styles.walletAmount}>{wallet[token]} шт.</Text>
          <Text style={styles.walletPrice}>${tokenPrices[token]}</Text>
        </View>
      ))}
      <Text style={styles.walletTotal}>
        Вартість портфеля: ${ALL_TOKENS.reduce((sum, t) => sum + wallet[t] * tokenPrices[t], 0).toFixed(2)}
      </Text>
      <Button title="Назад" onPress={() => setScreen('main')} />
    </View>
  );

  // Екран магазину монет
  const renderShopScreen = () => {
    const totalMoney = ALL_TOKENS.reduce((sum, t) => sum + wallet[t] * tokenPrices[t], 0);
    
    return (
      <View style={styles.shopOverlay}>
        <Text style={styles.shopTitle}>Магазин монет</Text>
        <Text style={styles.shopBalance}>Баланс: ${totalMoney.toFixed(2)}</Text>
        
        <View style={styles.shopGrid}>
          {COIN_SHOP.map(coin => {
            const isOwned = availableTokens.includes(coin.symbol);
            const canAfford = totalMoney >= coin.price;
            
            return (
              <View key={coin.symbol} style={[styles.shopItem, isOwned && styles.ownedItem]}>
                <Text style={styles.shopCoinSymbol}>{coin.symbol}</Text>
                <Text style={styles.shopCoinName}>{coin.name}</Text>
                <Text style={styles.shopCoinDesc}>{coin.description}</Text>
                {isOwned ? (
                  <Text style={styles.ownedText}>Власність</Text>
                ) : (
                  <>
                    <Text style={styles.shopCoinPrice}>${coin.price}</Text>
                    <TouchableOpacity 
                      style={[styles.buyButton, !canAfford && styles.disabledButton]}
                      onPress={() => buyCoin(coin.symbol)}
                      disabled={!canAfford}
                    >
                      <Text style={styles.buyButtonText}>
                        {canAfford ? 'Купити' : 'Недостатньо коштів'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            );
          })}
        </View>
        
        <Button title="Назад" onPress={() => setScreen('main')} />
      </View>
    );
  };

  // Екран покращень (заглушка)
  const renderUpgradesScreen = () => (
    <View style={styles.walletOverlay}>
      <Text style={styles.walletTitle}>Покращення (скоро)</Text>
      <Button title="Назад" onPress={() => setScreen('main')} />
    </View>
  );

  // Функція перемішування дошки
  const shuffleBoard = () => {
    if (isAnimating || gameOver || levelCompleted) return;
    
    // Створюємо нову дошку з тими ж монетами, але в іншому порядку
    const allCoins = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col]) {
          allCoins.push(board[row][col]);
        }
      }
    }
    
    // Перемішуємо монети
    for (let i = allCoins.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCoins[i], allCoins[j]] = [allCoins[j], allCoins[i]];
    }
    
    // Створюємо нову дошку
    const newBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
    let coinIndex = 0;
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (coinIndex < allCoins.length) {
          newBoard[row][col] = allCoins[coinIndex];
          coinIndex++;
        } else {
          newBoard[row][col] = getRandomEmoji();
        }
      }
    }
    
    setBoard(newBoard);
    setNoMovesAvailable(false);
    setHint(null);
  };

  // Функція повернення в головне меню
  const returnToMainMenu = () => {
    setGameOver(false);
    setLevelCompleted(false);
    setShowWallet(false);
    setEarnedCoins({});
    setNoMovesAvailable(false);
    setHint(null);
    setSelected(null);
    setMatches(null);
    setBonuses([]);
    setScore(0);
    setLevel(0);
    setMissionProgress(0);
    setMovesLeft(20);
    setTimeBonus(0);
    setScreen('main');
  };

  return (
    <SafeAreaView style={styles.container}>
      {screen === 'main' && renderMainMenu()}
      {screen === 'gameMode' && renderGameModeScreen()}
      {screen === 'wallet' && renderWalletScreen()}
      {screen === 'shop' && renderShopScreen()}
      {screen === 'upgrades' && renderUpgradesScreen()}
      {screen === 'game' && (
        <>
          <Text style={styles.title}>Crypto Match</Text>
          <Text style={styles.level}>
            {GAME_MODES[gameMode].hasLevels ? `Ринок: ${level + 1}` : GAME_MODES[gameMode].name}
          </Text>
          <Text style={styles.lives}>
            Гаманці: {'👜'.repeat(lives) + '⬜️'.repeat(Math.max(0, 10 - lives))}
          </Text>
          <Text style={styles.score}>Баланс: {score} / {targetScore}</Text>
          
          {/* Показуємо таймер тільки для режимів з часом */}
          {GAME_MODES[gameMode].hasTimer && (
            <Text style={styles.timer}>
              Час: {timer} сек {timeBonus > 0 && `(+${timeBonus})`}
            </Text>
          )}
          
          {/* Показуємо ходи для режиму пазл */}
          {GAME_MODES[gameMode].moveLimit && (
            <Text style={styles.moves}>Ходи: {movesLeft}</Text>
          )}
          
          {/* Місія тільки для кампанії */}
          {GAME_MODES[gameMode].hasMissions && (
            <Text style={styles.mission}>
              Місія: Збери {MISSIONS[level % MISSIONS.length].count} {MISSIONS[level % MISSIONS.length].name} {MISSIONS[level % MISSIONS.length].symbol} — {missionProgress} / {MISSIONS[level % MISSIONS.length].count}
            </Text>
          )}
          
          <View style={styles.board}>
            {board.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((cell, colIndex) => {
                  const isSelected = selected && selected[0] === rowIndex && selected[1] === colIndex;
                  const isHinted = hint && (
                    (hint[0][0] === rowIndex && hint[0][1] === colIndex) ||
                    (hint[1][0] === rowIndex && hint[1][1] === colIndex)
                  );
                  return (
                    <TouchableOpacity
                      key={colIndex}
                      style={[styles.cell, isSelected && styles.selectedCell]}
                      activeOpacity={0.7}
                      onPress={() => handleCellPress(rowIndex, colIndex)}
                      disabled={isAnimating || gameOver || levelCompleted || (GAME_MODES[gameMode].moveLimit && movesLeft <= 0)}
                    >
                      <Animated.View style={{ opacity: opacityAnim[rowIndex][colIndex], transform: [{ scale: isHinted ? hintAnim : 1 }] }}>
                        <Text style={styles.emoji}>{cell}</Text>
                      </Animated.View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
          
          <Text style={styles.info}>
            {GAME_MODES[gameMode].timeBonus ? 
              'Швидкі матчі дають бонус часу!' :
              'Збирай криптомонети! 4 в ряд — 🚀 Pump, 5 в ряд — 💥 Crypto Bomb, L/T — 💣 Exchange Crash!'
            }
          </Text>
          
          {/* Кнопка перемішування */}
          {noMovesAvailable && !isAnimating && !gameOver && !levelCompleted && (
            <View style={styles.shuffleContainer}>
              <Text style={styles.noMovesText}>Немає можливих ходів!</Text>
              <TouchableOpacity style={styles.shuffleButton} onPress={shuffleBoard}>
                <Text style={styles.shuffleButtonText}>🔄 Перемішати</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {gameOver && (
            <View style={styles.overlay}>
              <Text style={styles.gameOverText}>
                {levelCompleted ? 'Рівень пройдено!' : 'Гру завершено!'}
              </Text>
              <View style={styles.gameOverButtons}>
                <TouchableOpacity style={styles.gameOverButton} onPress={handleRestart}>
                  <Text style={styles.gameOverButtonText}>Почати спочатку</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.gameOverButton} onPress={returnToMainMenu}>
                  <Text style={styles.gameOverButtonText}>Головне меню</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {showWallet && renderWallet()}
          {levelCompleted && !gameOver && !showWallet && (
            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}> 
              <Text style={styles.gameOverText}>Рівень пройдено! Наступний стартує...</Text>
            </Animated.View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  level: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lives: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  score: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timer: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  board: {
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 16,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 48,
    height: 48,
    margin: 4,
    backgroundColor: '#444',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCell: {
    borderColor: '#fff',
  },
  emoji: {
    fontSize: 32,
  },
  info: {
    color: '#aaa',
    marginTop: 24,
    fontSize: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameOverText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  mission: {
    color: '#ffd700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  walletOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20,20,30,0.98)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  walletTitle: {
    color: '#ffd700',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  walletToken: {
    fontSize: 28,
    width: 40,
    textAlign: 'center',
  },
  walletAmount: {
    color: '#fff',
    fontSize: 20,
    width: 80,
    textAlign: 'center',
  },
  walletPrice: {
    color: '#0f0',
    fontSize: 18,
    width: 100,
    textAlign: 'center',
  },
  walletTotal: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  walletButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 24,
  },
  menuContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
  },
  menuTitle: {
    color: '#ffd700',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 48,
  },
  menuButton: {
    backgroundColor: '#333',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    marginBottom: 24,
    width: 220,
    alignItems: 'center',
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  menuButtonDesc: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
  shopOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20,20,30,0.98)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  shopTitle: {
    color: '#ffd700',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  shopBalance: {
    color: '#0f0',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  shopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 400,
    marginBottom: 24,
  },
  shopItem: {
    backgroundColor: '#333',
    padding: 16,
    margin: 8,
    borderRadius: 12,
    alignItems: 'center',
    width: 120,
    borderWidth: 2,
    borderColor: '#555',
  },
  ownedItem: {
    borderColor: '#ffd700',
    backgroundColor: '#2a2a1a',
  },
  shopCoinSymbol: {
    fontSize: 32,
    marginBottom: 8,
  },
  shopCoinName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  shopCoinDesc: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  shopCoinPrice: {
    color: '#0f0',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  buyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  ownedText: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  moves: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  earnedCoinsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
  },
  earnedCoinItem: {
    backgroundColor: '#333',
    padding: 8,
    margin: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  earnedCoinSymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  earnedCoinAmount: {
    color: '#0f0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  earnedCoinValue: {
    color: '#0f0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  earnedTotal: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  noEarnings: {
    color: '#aaa',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  nextLevelButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  nextLevelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mainMenuButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  mainMenuButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  shuffleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  noMovesText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  shuffleButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  shuffleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  gameOverButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 24,
  },
  gameOverButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  gameOverButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 
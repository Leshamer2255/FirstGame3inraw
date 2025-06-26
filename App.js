import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, Animated, Button } from 'react-native';

const BOARD_SIZE = 6;
const EMOJIS = ['🔴', '🟢', '🔵', '🟡', '🟣', '🟠'];
const BONUS = '💥';
const SUPER_BONUS = '🌈';
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

function getRandomEmoji() {
  return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
}

function generateBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, getRandomEmoji)
  );
}

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

export default function App() {
  const [board, setBoard] = useState(generateBoard());
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

  // Таймер
  useEffect(() => {
    if (gameOver || levelCompleted) return;
    if (timer <= 0) {
      // Якщо не досягнуто ціль — втрачаємо життя
      if (score < targetScore) {
        if (lives > 1) {
          setLives(l => l - 1);
          // Перезапускаємо рівень
          setTimer(LEVELS[level].time + 5 * level);
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
      return;
    }
    const interval = setInterval(() => {
      setTimer(t => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, gameOver, levelCompleted, score, targetScore, lives, level]);

  // Перевірка на проходження рівня
  useEffect(() => {
    if (!levelCompleted && score >= targetScore) {
      setLevelCompleted(true);
    }
  }, [score, targetScore, levelCompleted]);

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

  // Перехід на наступний рівень з додатковим часом
  useEffect(() => {
    if (levelCompleted) {
      setTimeout(() => {
        const nextLevel = level + 1;
        if (nextLevel < LEVELS.length) {
          setLevel(nextLevel);
          setTimer(LEVELS[nextLevel].time + 5 * nextLevel);
          setTargetScore(LEVELS[nextLevel].target);
          setScore(0);
          setBoard(generateBoard());
          setSelected(null);
          setMatches(null);
          setBonuses([]);
          setGameOver(false);
          setLevelCompleted(false);
          setLives(INITIAL_LIVES); // Відновлюємо життя
        } else {
          setGameOver(true);
        }
      }, 2000);
    }
  }, [levelCompleted]);

  const handleCellPress = (row, col) => {
    if (isAnimating || gameOver || levelCompleted) return;
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
      setBoard(newBoard);
      setMatches(foundMatches);
      setBonuses(foundBonuses);
    } else {
      setBoard(cloneBoard(board));
    }
    setSelected(null);
  };

  const handleRestart = () => {
    setLevel(0);
    setTimer(LEVELS[0].time);
    setTargetScore(LEVELS[0].target);
    setScore(0);
    setBoard(generateBoard());
    setSelected(null);
    setMatches(null);
    setBonuses([]);
    setGameOver(false);
    setLevelCompleted(false);
    setLives(INITIAL_LIVES);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>3 в ряд</Text>
      <Text style={styles.level}>Рівень: {level + 1}</Text>
      <Text style={styles.lives}>Життя: {'❤️'.repeat(lives) + '🤍'.repeat(Math.max(0, INITIAL_LIVES - lives))}</Text>
      <Text style={styles.score}>Очки: {score} / {targetScore}</Text>
      <Text style={styles.timer}>Час: {timer} сек</Text>
      <View style={styles.board}>
        {board.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => {
              const isSelected = selected && selected[0] === rowIndex && selected[1] === colIndex;
              return (
                <TouchableOpacity
                  key={colIndex}
                  style={[styles.cell, isSelected && styles.selectedCell]}
                  activeOpacity={0.7}
                  onPress={() => handleCellPress(rowIndex, colIndex)}
                  disabled={isAnimating || gameOver || levelCompleted}
                >
                  <Animated.View style={{ opacity: opacityAnim[rowIndex][colIndex] }}>
                    {cell === BONUS || cell === SUPER_BONUS || cell === CROSS_BONUS ? (
                      <Text style={styles.emoji}>{cell}</Text>
                    ) : (
                      <Text style={styles.emoji}>{cell}</Text>
                    )}
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
      <Text style={styles.info}>Тапни по двом сусіднім кружечкам для обміну. 4 в ряд = 💥 бонус!</Text>
      {gameOver && (
        <View style={styles.overlay}>
          <Text style={styles.gameOverText}>{levelCompleted ? 'Рівень пройдено!' : 'Гру завершено!'}</Text>
          <Button title="Почати спочатку" onPress={handleRestart} />
        </View>
      )}
      {levelCompleted && !gameOver && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}> 
          <Text style={styles.gameOverText}>Рівень пройдено! Наступний стартує...</Text>
        </Animated.View>
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
}); 
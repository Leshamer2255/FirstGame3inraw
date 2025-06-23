import React, { useState, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, Animated } from 'react-native';

const BOARD_SIZE = 6;
const EMOJIS = ['🔴', '🟢', '🔵', '🟡', '🟣', '🟠'];
const BONUS = '💥';
const ANIMATION_DURATION = 350;

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
          matchGroups.push({ type: 'row', count, cells: group });
          if (count >= 4) {
            const bonusCol = col - 1 - Math.floor(Math.random() * count);
            bonuses.push({ type: 'row', row, col: bonusCol });
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
      matchGroups.push({ type: 'row', count, cells: group });
      if (count >= 4) {
        const bonusCol = BOARD_SIZE - 1 - Math.floor(Math.random() * count);
        bonuses.push({ type: 'row', row, col: bonusCol });
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
          matchGroups.push({ type: 'col', count, cells: group });
          if (count >= 4) {
            const bonusRow = row - 1 - Math.floor(Math.random() * count);
            bonuses.push({ type: 'col', row: bonusRow, col });
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
      matchGroups.push({ type: 'col', count, cells: group });
      if (count >= 4) {
        const bonusRow = BOARD_SIZE - 1 - Math.floor(Math.random() * count);
        bonuses.push({ type: 'col', row: bonusRow, col });
      }
    }
  }

  return { matches, bonuses, matchGroups };
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
      newBoard[bonus.row][bonus.col] = BONUS;
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

function activateBonus(board, bonus) {
  let newBoard = cloneBoard(board);
  if (bonus.type === 'row') {
    for (let col = 0; col < BOARD_SIZE; col++) {
      newBoard[bonus.row][col] = null;
    }
  } else if (bonus.type === 'col') {
    for (let row = 0; row < BOARD_SIZE; row++) {
      newBoard[row][bonus.col] = null;
    }
  }
  return newBoard;
}

function getBonusMatches(board, bonus) {
  const matches = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));
  if (bonus.type === 'row') {
    for (let col = 0; col < BOARD_SIZE; col++) {
      matches[bonus.row][col] = true;
    }
  } else if (bonus.type === 'col') {
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
  const opacityAnim = useRef(
    Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => new Animated.Value(1))
    )
  ).current;

  // Очищення стартових матчів
  React.useEffect(() => {
    let b = board;
    let { matches: m, bonuses: bs, matchGroups: mg } = findMatches(b);
    while (hasAnyMatches(m)) {
      // Підрахунок очок для старту (не обов'язково, але для коректності)
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
  React.useEffect(() => {
    if (!matches) return;
    setIsAnimating(true);
    // Запускаємо анімацію для всіх matched
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
      // Підрахунок очок за матчі
      let points = 0;
      if (matches && matches.length) {
        // Пошук груп для підрахунку очок
        let { matchGroups } = findMatches(board);
        for (const group of matchGroups) {
          if (group.count === 3) points += 10 * 3;
          else if (group.count >= 4) points += 20 * group.count;
        }
      }
      setScore(s => s + points);
      // Після анімації — видалити та впустити нові
      let newBoard = removeMatchesAndDrop(board, matches, bonuses);
      // Скинути opacity для нових
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          opacityAnim[row][col].setValue(1);
        }
      }
      // Якщо є бонуси — активувати їх
      if (bonuses.length > 0) {
        // Активуємо всі бонуси по черзі
        let tempBoard = newBoard;
        let bonusMatches = null;
        let bonusIndex = 0;
        function activateNextBonus() {
          if (bonusIndex >= bonuses.length) {
            // Після всіх бонусів — перевірити чи є ще матчі
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
          bonusMatches = getBonusMatches(tempBoard, bonus);
          // Підрахунок очок за активацію бонусу
          let bonusPoints = 0;
          for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
              if (bonusMatches[row][col]) bonusPoints += 50;
            }
          }
          setScore(s => s + bonusPoints);
          // Анімація для всього ряду/стовпця
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
            tempBoard = activateBonus(tempBoard, bonus);
            // Скинути opacity для нових
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
        // Перевірити чи є ще матчі (chain reaction)
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

  const handleCellPress = (row, col) => {
    if (isAnimating) return; // блокувати під час анімації
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
    // Swap
    let newBoard = cloneBoard(board);
    [newBoard[selRow][selCol], newBoard[row][col]] = [newBoard[row][col], newBoard[selRow][selCol]];
    // Check for matches
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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>3 в ряд</Text>
      <Text style={styles.score}>Очки: {score}</Text>
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
                  disabled={isAnimating}
                >
                  <Animated.View style={{ opacity: opacityAnim[rowIndex][colIndex] }}>
                    <Text style={styles.emoji}>{cell}</Text>
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
      <Text style={styles.info}>Тапни по двом сусіднім кружечкам для обміну. 4 в ряд = 💥 бонус!</Text>
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
  score: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
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
}); 
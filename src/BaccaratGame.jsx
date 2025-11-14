import React, { useState } from 'react';
import { RotateCcw, Trophy, TrendingUp, TrendingDown, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

const BaccaratGame = () => {
  const [gameState, setGameState] = useState('betting');
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [bankerHand, setBankerHand] = useState([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [bankerScore, setBankerScore] = useState(0);
  const [result, setResult] = useState('');
  const [bet, setBet] = useState('');
  const [betAmount, setBetAmount] = useState(100);
  const [balance, setBalance] = useState(10000);
  const [gameLog, setGameLog] = useState('');
  const [history, setHistory] = useState([]);
  const [winner, setWinner] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [playerAnimationFlags, setPlayerAnimationFlags] = useState([]);
  const [bankerAnimationFlags, setBankerAnimationFlags] = useState([]);

  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const chipValues = [10, 25, 50, 100, 250, 500, 1000];

  const createDeck = (numberOfDecks = 6) => {
    const newDeck = [];
    for (let d = 0; d < numberOfDecks; d++) {
      for (const suit of suits) {
        for (const value of values) {
          newDeck.push(value + suit);
        }
      }
    }
    // Shuffle med Fisher-Yates
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  };

  const getCardValue = (card) => {
    const value = card.slice(0, -1);
    if (value === 'A') return 1;
    if (['J', 'Q', 'K', '10'].includes(value)) return 0;
    return parseInt(value);
  };

  const calculateScore = (hand) => {
    const total = hand.reduce((sum, card) => sum + getCardValue(card), 0);
    return total % 10;
  };

  const drawCard = (currentDeck) => {
    if (currentDeck.length < 10) {
      const newDeck = createDeck(6);
      return { card: newDeck.pop(), newDeck };
    }
    return { card: currentDeck.pop(), newDeck: currentDeck };
  };

  // Beregn statistikk
  const getStats = () => {
    if (history.length === 0) return { wins: 0, losses: 0, winRate: 0, totalWon: 0, totalLost: 0 };
    
    const wins = history.filter(h => h.won).length;
    const losses = history.length - wins;
    const winRate = (wins / history.length) * 100;
    const totalWon = history.filter(h => h.won).reduce((sum, h) => sum + (h.payout || 0), 0);
    const totalLost = history.filter(h => !h.won).reduce((sum, h) => sum + (h.betAmount || 0), 0);
    
    return { wins, losses, winRate, totalWon, totalLost };
  };

  const playGame = async (betOn) => {
    if (balance < betAmount) {
      alert('Ikke nok penger!');
      return;
    }

    setBet(betOn);
    setGameState('playing');
    setPlayerAnimationFlags([]);
    setBankerAnimationFlags([]);
    setGameLog('');
    setWinner(null);
    setShowConfetti(false);
    setBalance(prev => prev - betAmount);

    let currentDeck = deck.length > 0 ? [...deck] : createDeck(6);
    let log = [];

    // Del ut to kort til hver med animasjon
    const delays = [0, 1300, 1600, 1900];
    let pHand = [];
    let bHand = [];

    for (let i = 0; i < 2; i++) {
      await new Promise(resolve => setTimeout(resolve, delays[i * 2]));
      const { card: pCard, newDeck: deck1 } = drawCard(currentDeck);
      currentDeck = deck1;
      pHand.push(pCard);
      setPlayerHand([...pHand]);
      setPlayerAnimationFlags(prev => {
        const next = [...prev];
        next[pHand.length - 1] = true;
        return next;
      });

      await new Promise(resolve => setTimeout(resolve, delays[i * 2 + 1]));
      const { card: bCard, newDeck: deck2 } = drawCard(currentDeck);
      currentDeck = deck2;
      bHand.push(bCard);
      setBankerHand([...bHand]);
      setBankerAnimationFlags(prev => {
        const next = [...prev];
        next[bHand.length - 1] = true;
        return next;
      });
    }

    let pScore = calculateScore(pHand);
    let bScore = calculateScore(bHand);
    setPlayerScore(pScore);
    setBankerScore(bScore);

    // Natural win (8 eller 9)
    if (pScore >= 8 || bScore >= 8) {
      log.push(pScore >= 8 ? `🎯 Spiller har natural ${pScore}!` : `🎯 Banker har natural ${bScore}!`);
      setGameLog(log.join('\n'));
      await new Promise(resolve => setTimeout(resolve, 2500));
      finishGame(pHand, bHand, pScore, bScore, betOn, currentDeck, log.join('\n'));
      return;
    }

    // Player trekker tredje kort
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (pScore <= 5) {
      const { card: newCard, newDeck: deck3 } = drawCard(currentDeck);
      currentDeck = deck3;
      pHand.push(newCard);
      setPlayerHand([...pHand]);
      setPlayerAnimationFlags(prev => {
        const next = [...prev];
        next[pHand.length - 1] = true;
        return next;
      });
      pScore = calculateScore(pHand);
      setPlayerScore(pScore);
      log.push(`📥 Spiller trekker (poeng ≤ 5): ${newCard}`);
      setGameLog(log.join('\n'));
    } else {
      log.push('✋ Spiller står (poeng > 5)');
      setGameLog(log.join('\n'));
    }

    // Banker trekker basert på regler
    await new Promise(resolve => setTimeout(resolve, 2000));
    const playerThirdCard = pHand[2] ? getCardValue(pHand[2]) : null;
    let bankerDraws = false;
    let bankerReason = '';

    if (playerThirdCard === null) {
      bankerDraws = bScore <= 5;
      bankerReason = bankerDraws ? '📥 Banker trekker (poeng ≤ 5, spiller står)' : '✋ Banker står (poeng > 5)';
    } else {
      if (bScore <= 2) {
        bankerDraws = true;
        bankerReason = '📥 Banker trekker (poeng ≤ 2)';
      } else if (bScore === 3 && playerThirdCard !== 8) {
        bankerDraws = true;
        bankerReason = `📥 Banker trekker (poeng 3, spillers 3. kort ikke 8)`;
      } else if (bScore === 4 && [2,3,4,5,6,7].includes(playerThirdCard)) {
        bankerDraws = true;
        bankerReason = `📥 Banker trekker (poeng 4, spillers 3. kort er ${playerThirdCard})`;
      } else if (bScore === 5 && [4,5,6,7].includes(playerThirdCard)) {
        bankerDraws = true;
        bankerReason = `📥 Banker trekker (poeng 5, spillers 3. kort er ${playerThirdCard})`;
      } else if (bScore === 6 && [6,7].includes(playerThirdCard)) {
        bankerDraws = true;
        bankerReason = `📥 Banker trekker (poeng 6, spillers 3. kort er ${playerThirdCard})`;
      } else {
        bankerReason = `✋ Banker står (reglene tillater ikke trekk)`;
      }
    }

    if (bankerDraws) {
      const { card: newCard, newDeck: deck4 } = drawCard(currentDeck);
      currentDeck = deck4;
      bHand.push(newCard);
      setBankerHand([...bHand]);
      setBankerAnimationFlags(prev => {
        const next = [...prev];
        next[bHand.length - 1] = true;
        return next;
      });
      bScore = calculateScore(bHand);
      setBankerScore(bScore);
      log.push(`${bankerReason}: ${newCard}`);
    } else {
      log.push(bankerReason);
    }
    setGameLog(log.join('\n'));

    await new Promise(resolve => setTimeout(resolve, 2500));
    finishGame(pHand, bHand, pScore, bScore, betOn, currentDeck, log.join('\n'));
  };

  const finishGame = (pHand, bHand, pScore, bScore, betOn, currentDeck, log) => {
    setDeck(currentDeck);

    let gameWinner;
    if (pScore > bScore) gameWinner = 'player';
    else if (bScore > pScore) gameWinner = 'banker';
    else gameWinner = 'tie';

    setWinner(gameWinner);

    let resultText;
    let won = false;
    let payout = 0;

    if (gameWinner === betOn) {
      won = true;
      if (betOn === 'tie') {
        payout = betAmount * 8; // 8:1 for tie
        resultText = `🎉 Du vant på uavgjort! +${payout.toLocaleString()} kr (8:1)`;
      } else if (betOn === 'banker') {
        payout = Math.floor(betAmount * 0.95); // 19:20 for banker (5% kommisjon)
        resultText = `🎉 Du vant på banker! +${payout.toLocaleString()} kr (19:20)`;
      } else {
        payout = betAmount; // 1:1 for player
        resultText = `🎉 Du vant på spiller! +${payout.toLocaleString()} kr (1:1)`;
      }
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } else {
      resultText = `😞 Du tapte -${betAmount.toLocaleString()} kr`;
    }

    setResult(resultText);
    setGameState('finished');
    setBalance(prev => prev + payout);

    // Legg til i historikk
    const newHistory = [{
      winner: gameWinner,
      bet: betOn,
      playerScore: pScore,
      bankerScore: bScore,
      won,
      payout: won ? payout : 0,
      betAmount,
      timestamp: new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }, ...history].slice(0, 20);
    setHistory(newHistory);
  };

  const resetGame = () => {
    setGameState('betting');
    setPlayerHand([]);
    setBankerHand([]);
    setPlayerScore(0);
    setBankerScore(0);
    setResult('');
    setBet('');
    setGameLog('');
    setWinner(null);
    setPlayerAnimationFlags([]);
    setBankerAnimationFlags([]);
  };

  const handleCardAnimationComplete = (hand, index) => {
    if (hand === 'player') {
      setPlayerAnimationFlags(prev => {
        if (!prev[index]) return prev;
        const next = [...prev];
        next[index] = false;
        return next;
      });
    } else {
      setBankerAnimationFlags(prev => {
        if (!prev[index]) return prev;
        const next = [...prev];
        next[index] = false;
        return next;
      });
    }
  };

  const Card = ({ card, index, isWinning = false, shouldAnimate = false, onAnimationComplete }) => {
    const suit = card.slice(-1);
    const value = card.slice(0, -1);
    const isRed = suit === '♥' || suit === '♦';
    const suitSymbol = suit;

    const cardContent = (
      <>
        <div className="absolute top-1 left-1 text-sm font-bold">{value}</div>
        <div className="absolute top-1 right-1 text-sm">{suitSymbol}</div>
        <div className="text-4xl">{suitSymbol}</div>
        <div className="absolute bottom-1 right-1 text-sm font-bold transform rotate-180">{value}</div>
        <div className="absolute bottom-1 left-1 text-sm transform rotate-180">{suitSymbol}</div>
      </>
    );

    if (shouldAnimate) {
      return (
        <motion.div
          initial={{ x: -100, opacity: 0, rotateY: 90, scale: 0.8 }}
          animate={{ 
            x: 0, 
            opacity: 1, 
            rotateY: 0, 
            scale: 1,
            boxShadow: isWinning ? '0 0 20px rgba(255, 215, 0, 0.8)' : '0 4px 6px rgba(0, 0, 0, 0.3)'
          }}
          transition={{ 
            duration: 0.5,
            delay: 0,
            type: "spring",
            stiffness: 200
          }}
          onAnimationComplete={onAnimationComplete}
          className={`relative w-20 h-28 bg-white rounded-lg border-2 ${isWinning ? 'border-yellow-400 border-4' : 'border-gray-300'} flex flex-col items-center justify-center text-xl font-bold shadow-lg overflow-hidden ${isRed ? 'text-red-600' : 'text-black'}`}
        >
          {cardContent}
        </motion.div>
      );
    }

    return (
      <div
        className={`relative w-20 h-28 bg-white rounded-lg border-2 ${isWinning ? 'border-yellow-400 border-4' : 'border-gray-300'} flex flex-col items-center justify-center text-xl font-bold shadow-lg overflow-hidden ${isRed ? 'text-red-600' : 'text-black'}`}
        style={{
          boxShadow: isWinning ? '0 0 20px rgba(255, 215, 0, 0.8)' : '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}
      >
        {cardContent}
      </div>
    );
  };

  const Confetti = () => {
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: -20,
              rotate: 0,
              opacity: 1
            }}
            animate={{
              y: window.innerHeight + 100,
              rotate: 360,
              opacity: 0
            }}
            transition={{
              duration: Math.random() * 2 + 2,
              delay: Math.random() * 0.5,
              ease: "easeOut"
            }}
            className="absolute w-3 h-3 rounded-full"
            style={{
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][Math.floor(Math.random() * 5)]
            }}
          />
        ))}
      </div>
    );
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-900 to-green-950 p-4 md:p-8">
      {showConfetti && <Confetti />}
      
      <div className="max-w-7xl mx-auto">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl md:text-6xl font-bold text-center text-yellow-300 mb-4 drop-shadow-lg"
        >
          🎰 Baccarat
        </motion.h1>

        {/* Balance og statistikk */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap justify-center gap-4 mb-6"
        >
          <div className="bg-gray-800 bg-opacity-80 rounded-xl p-4 flex items-center gap-3 shadow-xl">
            <Coins className="text-yellow-400" size={24} />
            <div>
              <div className="text-xs text-gray-400">Saldo</div>
              <div className="text-2xl font-bold text-white">{balance.toLocaleString()} kr</div>
            </div>
          </div>
          <div className="bg-gray-800 bg-opacity-80 rounded-xl p-4 flex items-center gap-3 shadow-xl">
            <Trophy className="text-yellow-400" size={24} />
            <div>
              <div className="text-xs text-gray-400">Seiere</div>
              <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
            </div>
          </div>
          <div className="bg-gray-800 bg-opacity-80 rounded-xl p-4 flex items-center gap-3 shadow-xl">
            <TrendingUp className="text-green-400" size={24} />
            <div>
              <div className="text-xs text-gray-400">Vinnerate</div>
              <div className="text-2xl font-bold text-white">{stats.winRate.toFixed(1)}%</div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hovedspill */}
          <div className="lg:col-span-2">
            {gameState === 'betting' && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-green-700 bg-opacity-90 rounded-xl p-8 shadow-2xl"
              >
                <h2 className="text-2xl text-white text-center mb-6">Plasser ditt veddemål</h2>
                
                {/* Chip valg */}
                <div className="mb-6">
                  <label className="block text-white text-sm mb-2 text-center">Velg innsats</label>
                  <div className="flex gap-2 justify-center flex-wrap">
                    {chipValues.map((value) => (
                      <motion.button
                        key={value}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setBetAmount(value)}
                        className={`px-4 py-2 rounded-lg font-bold transition-all ${
                          betAmount === value
                            ? 'bg-yellow-500 text-gray-900 scale-110 shadow-lg'
                            : 'bg-gray-600 text-white hover:bg-gray-500'
                        }`}
                      >
                        {value}
                      </motion.button>
                    ))}
                  </div>
                  <div className="text-center mt-3">
                    <span className="text-yellow-300 font-bold text-lg">Innsats: {betAmount.toLocaleString()} kr</span>
                  </div>
                </div>

                {/* Betting knapper */}
                <div className="flex gap-4 justify-center flex-wrap">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => playGame('player')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-12 rounded-xl text-xl transition-colors shadow-lg relative overflow-hidden group"
                  >
                    <span className="relative z-10">👤 Spiller</span>
                    <span className="absolute inset-0 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => playGame('banker')}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-6 px-12 rounded-xl text-xl transition-colors shadow-lg relative overflow-hidden group"
                  >
                    <span className="relative z-10">🏦 Banker</span>
                    <span className="absolute inset-0 bg-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => playGame('tie')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-6 px-12 rounded-xl text-xl transition-colors shadow-lg relative overflow-hidden group"
                  >
                    <span className="relative z-10">🤝 Uavgjort</span>
                    <span className="absolute inset-0 bg-yellow-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                  </motion.button>
                </div>
                <div className="mt-6 text-center text-white text-sm">
                  Kort i shoe: {deck.length > 0 ? deck.length : 312} / 312
                </div>
              </motion.div>
            )}

            {(gameState === 'playing' || gameState === 'finished') && (
              <div className="space-y-6">
                {/* Banker */}
                <motion.div 
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={`bg-red-900 bg-opacity-70 rounded-xl p-6 shadow-xl border-4 transition-all ${
                    winner === 'banker' ? 'border-yellow-400 shadow-yellow-400/50' : 'border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      🏦 Banker
                      {winner === 'banker' && <span className="text-yellow-400">👑</span>}
                    </h3>
                    <motion.span 
                      key={bankerScore}
                      initial={{ scale: 1.5, rotate: 360 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className={`text-4xl font-bold ${winner === 'banker' ? 'text-yellow-300' : 'text-yellow-300'}`}
                    >
                      {bankerScore}
                    </motion.span>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {bankerHand.map((card, i) => (
                      <Card 
                        key={`${card}-${i}`}
                        card={card} 
                        index={i} 
                        isWinning={winner === 'banker'} 
                        shouldAnimate={!!bankerAnimationFlags[i]}
                        onAnimationComplete={() => handleCardAnimationComplete('banker', i)}
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Player */}
                <motion.div 
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={`bg-blue-900 bg-opacity-70 rounded-xl p-6 shadow-xl border-4 transition-all ${
                    winner === 'player' ? 'border-yellow-400 shadow-yellow-400/50' : 'border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      👤 Spiller
                      {winner === 'player' && <span className="text-yellow-400">👑</span>}
                    </h3>
                    <motion.span 
                      key={playerScore}
                      initial={{ scale: 1.5, rotate: 360 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className={`text-4xl font-bold ${winner === 'player' ? 'text-yellow-300' : 'text-yellow-300'}`}
                    >
                      {playerScore}
                    </motion.span>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {playerHand.map((card, i) => (
                      <Card 
                        key={`${card}-${i}`} 
                        card={card} 
                        index={i} 
                        isWinning={winner === 'player'} 
                        shouldAnimate={!!playerAnimationFlags[i]}
                        onAnimationComplete={() => handleCardAnimationComplete('player', i)}
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Game Log */}
                {gameLog && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800 bg-opacity-80 rounded-xl p-4 shadow-xl border border-gray-700"
                  >
                    <h4 className="text-lg font-bold text-yellow-300 mb-2">📋 Spillforløp</h4>
                    <div className="text-white text-sm whitespace-pre-line font-mono bg-gray-900 bg-opacity-50 p-3 rounded">
                      {gameLog}
                    </div>
                  </motion.div>
                )}

                {gameState === 'finished' && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-4"
                  >
                    <motion.div 
                      initial={{ y: 20 }}
                      animate={{ y: 0 }}
                      className={`rounded-xl p-6 shadow-xl ${
                        result.includes('🎉') 
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' 
                          : 'bg-gradient-to-r from-red-500 to-red-700'
                      }`}
                    >
                      <p className="text-3xl font-bold text-gray-900">{result}</p>
                      <p className="text-lg text-gray-800 mt-2">
                        Du satset på: <span className="font-bold">
                          {bet === 'player' ? '👤 Spiller' : bet === 'banker' ? '🏦 Banker' : '🤝 Uavgjort'}
                        </span>
                      </p>
                      <p className="text-sm text-gray-700 mt-1">Kort igjen i shoe: {deck.length}</p>
                    </motion.div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetGame}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl text-xl transition-colors shadow-lg inline-flex items-center gap-2"
                    >
                      <RotateCcw size={24} />
                      Spill på nytt
                    </motion.button>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar med historikk og statistikk */}
          <div className="lg:col-span-1 space-y-6">
            {/* Statistikk */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-gray-800 bg-opacity-80 rounded-xl p-6 shadow-xl"
            >
              <h3 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
                <TrendingUp size={24} />
                Statistikk
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Totale runder:</span>
                  <span className="text-white font-bold">{history.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Seiere:</span>
                  <span className="text-green-400 font-bold">{stats.wins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Tap:</span>
                  <span className="text-red-400 font-bold">{stats.losses}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Vinnerate:</span>
                  <span className="text-white font-bold">{stats.winRate.toFixed(1)}%</span>
                </div>
                <div className="border-t border-gray-700 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total gevinst:</span>
                    <span className="text-green-400 font-bold">+{stats.totalWon.toLocaleString()} kr</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total tap:</span>
                    <span className="text-red-400 font-bold">-{stats.totalLost.toLocaleString()} kr</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700">
                    <span className="text-gray-300">Netto:</span>
                    <span className={`font-bold text-lg ${
                      (stats.totalWon - stats.totalLost) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {(stats.totalWon - stats.totalLost) >= 0 ? '+' : ''}
                      {(stats.totalWon - stats.totalLost).toLocaleString()} kr
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Historikk */}
            <div className="bg-gray-800 bg-opacity-80 rounded-xl p-6 shadow-xl sticky top-4 max-h-[600px] overflow-y-auto history-scrollbar">
              <h3 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
                <Trophy size={24} />
                Historikk
              </h3>
              {history.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Ingen runder spilt ennå</p>
              ) : (
                <div className="space-y-2">
                  {history.map((round, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-3 rounded-lg border-2 ${
                        round.won 
                          ? 'bg-green-600 bg-opacity-30 border-green-500' 
                          : 'bg-red-600 bg-opacity-30 border-red-500'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-white flex items-center gap-1">
                          {round.winner === 'player' ? '👤' : round.winner === 'banker' ? '🏦' : '🤝'}
                          {round.winner === 'player' ? 'Spiller' : round.winner === 'banker' ? 'Banker' : 'Uavgjort'}
                          {round.won && <span className="text-yellow-400">👑</span>}
                        </span>
                        <span className="text-xs text-gray-300">{round.timestamp}</span>
                      </div>
                      <div className="text-sm text-gray-200">
                        Satset: {round.bet === 'player' ? '👤 Spiller' : round.bet === 'banker' ? '🏦 Banker' : '🤝 Uavgjort'} ({round.betAmount.toLocaleString()} kr)
                      </div>
                      <div className="text-xs text-gray-300 mt-1">
                        Poeng: Spiller {round.playerScore} - Banker {round.bankerScore}
                      </div>
                      {round.won && (
                        <div className="text-xs text-green-300 font-bold mt-1">
                          +{round.payout.toLocaleString()} kr
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaccaratGame;

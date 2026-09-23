import { useEffect, useState } from 'react';
import {GAME_SETTING, MAX_GUESSES, SECRET_WORD_BACKUPS} from  '../constants';


import WordRow from '../components/WordRow';
import WordSettings from '../components/WordSettings';

const computeLetters = (word, secret, setting) => {
  let results = [];
  let secretUsed = Array.from({ length: setting }, () => false);

  for (let i = 0; i < setting; i++) {
    if (word[i] === secret[i]) {
      results[i] = 'green';
      secretUsed[i] = true;
    }
  }

  for (let i = 0; i < setting; i++) {
    if (results[i] === 'green') continue;

    let foundMatch = false;

    for (let j = 0; j < secretUsed.length; j++) {
      if (secret[j] === word[i] && !secretUsed[j]) {
        secretUsed[j] = true;
        foundMatch = true;
        break;
      }
    }

    results[i] = foundMatch ? 'yellow' : 'grey';
  }

  return results;
};

export default function WordBoard () {
  const [gameId, setGameId] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [gameResult, setGameResult] = useState('');
  const [secretWord, setSecretWord] = useState('');
  const [wordSetting, setWordSetting] = useState('medium');
  const [selectedLevel, setSelectedLevel] = useState('medium');
  const [definition, setDefinition] = useState(null);

  useEffect(() => {
    const getSecretWord = async () => {
      const length = GAME_SETTING[wordSetting];

      try {
        const url = `https://random-word-api.herokuapp.com/word?length=${length}&diff=1`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        const word = data[0];

        if (word?.length !== length) {
          throw new Error(`API returned invalid word.`);
        }

        setSecretWord(word.toLowerCase());
      } catch {
        const backUpWords = SECRET_WORD_BACKUPS[wordSetting];
        const randomIndex = Math.floor(Math.random() * backUpWords.length);
        setSecretWord(backUpWords[randomIndex].toLowerCase());
      }
    };

    getSecretWord();
  }, [wordSetting, gameId]);

  useEffect(() => {
    if (gameResult === '') {
      setDefinition(null);
      return;
    }

    const getWordDefinition = async () => {
      try {
        const url = `https://freedictionaryapi.com/api/v1/entries/en/${secretWord.toLowerCase()}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        const definition = data.entries[0].senses[0].definition;

        if (definition?.length === 0) {
          throw new Error(`API returned empty definition.`);
        }

        setDefinition(definition);
      } catch (error) {
        console.error(error.message);
        setDefinition(null);
      }
    };

    getWordDefinition();
  }, [gameResult, secretWord]);

  const guessWord = () => {
    const trimmedWord = currentWord.trim().toLowerCase();
    
    if(gameResult) return;

    if (trimmedWord.length !== GAME_SETTING[wordSetting]) {
      setErrorMessage(`Word must be ${GAME_SETTING[wordSetting]} letters long`);
      return;
    }

    const isAlreadyGuessedWord = guesses.some(
      (guess) => guess.word.toLowerCase() === trimmedWord,
    );

    if (isAlreadyGuessedWord) {
      setErrorMessage('Word already guessed! Try another word.');
      return;
    }

    setErrorMessage('');
    setCurrentWord('');

    setGuesses((previousGuesses) => [
      ...previousGuesses,
      {
        word: trimmedWord,
        result: computeLetters(
          trimmedWord,
          secretWord,
          GAME_SETTING[wordSetting],
        ),
      },
    ]);

    if (trimmedWord === secretWord) {
      setGameResult('won');
    } else if (guesses.length + 1 === MAX_GUESSES) {
      setGameResult('lost');
    }
  };

  const newGame = () => {
    setCurrentWord('');
    setGameResult('');
    setErrorMessage('');
    setGuesses([]);
    setWordSetting(selectedLevel);
    setGameId((id) => id + 1);
  };

  return (
    <div className="board-container">
      <WordSettings
        setting={selectedLevel}
        onSettingChange={(event) => setSelectedLevel(event.target.value)}
        onNewGame={() => newGame()}
      />
      <div className={`word-board`}>
        {Array.from({ length: MAX_GUESSES }, (_, index) => (
          <WordRow
            key={index}
            guess={guesses[index] ?? ''}
            setting={wordSetting}
          />
        ))}
      </div>
      <div className='message-container'>
        <p className='green'>
          {gameResult === 'won' && 'You win the game!'}
        </p>
        <p className='pink'>
          {gameResult === 'lost' && (
            <>
              You lost, try again next time.
              <br />
              Secret word '{secretWord.toUpperCase()}'.
            </>
          )}
        </p>
         <p className='pink'>{errorMessage}</p>
      </div>
      <div className='word-input'>
        <input
          title="Input your word"
          placeholder={`Type a ${GAME_SETTING[wordSetting]} letter word`}
          id="word-input"
          type="text"
          value={currentWord}
          onChange={(event) => setCurrentWord(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              guessWord();
            }
          }}
        ></input>
        <button
          className='button_primary blue'
          type="button"
          title="Guess Word"
          disabled={gameResult !== '' || guesses.length >= MAX_GUESSES}
          onClick={() => guessWord()}
        >
          
          Enter
        </button>
      </div>
      <div style={{height: 100, paddingTop: 12}}>
        {definition && (
          <p>
            {secretWord[0].toUpperCase() + secretWord.slice(1)}: {definition}
          </p>
        )}
      </div>
    </div>
  )
}


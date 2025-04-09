import React, { useState, useEffect } from 'react'
import Tile from '../components/Tile'
import { Tile as TileModel } from '../models/Tile'
import './GamePage.css'

// 关卡配置数据的接口
interface LevelConfig {
    level: number;
    rows: number;
    cols: number;
    tiles: string[];
}

const TOTAL_LEVELS = 10

// 提示颜色数组，每次提示将依次使用其中一种颜色
const hintColors = [
    "#FFC107",
    "#8BC34A",
    "#03A9F4",
    "#E91E63",
    "#9C27B0",
    "#FF5722",
    "#00BCD4"
]

// 游戏状态类型
type GameStatus = "playing" | "failed" | "succeeded"

const GamePage: React.FC = () => {
    // 当前关卡及关卡数据
    const [currentLevel, setCurrentLevel] = useState<number>(1)
    const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null)
    // 所有卡牌数据
    const [tiles, setTiles] = useState<TileModel[]>([])
    // 当前选中的两张牌
    const [firstSelection, setFirstSelection] = useState<TileModel | null>(null)
    const [secondSelection, setSecondSelection] = useState<TileModel | null>(null)
    // 标记当前是否处于匹配判断过程
    const [processing, setProcessing] = useState<boolean>(false)
    // 提示相关：剩余提示次数、提示颜色索引
    const [hintCount, setHintCount] = useState<number>(0)
    const [hintColorIndex, setHintColorIndex] = useState<number>(0)
    // 倒计时，初始值为关卡编号*10
    const [countDown, setCountDown] = useState<number>(0)
    // 游戏状态：playing / failed / succeeded
    const [gameStatus, setGameStatus] = useState<GameStatus>("playing")

    // 用于存储不匹配卡牌的计时器
    // const timerRef = useRef<NodeJS.Timeout | null>(null)

    // 当关卡切换时加载数据，并初始化状态
    useEffect(() => {
        import(`../data/level${currentLevel}.json`)
            .then(module => {
                const config: LevelConfig = module.default
                setLevelConfig(config)
                // 提示次数初始等于关卡编号
                setHintCount(config.level)
                // 重置提示颜色索引
                setHintColorIndex(0)
                // 初始化倒计时
                setCountDown(2 * config.rows * config.cols + config.level)
                // 初始化所有卡牌，并将 isHintUsed 设置为 false
                const initTiles: TileModel[] = config.tiles.map((value: string, index: number) => ({
                    id: index,
                    value,
                    isFlipped: false,
                    isMatched: false,
                    isHintUsed: false,
                    hintedColor: undefined
                }))
                // 随机打乱顺序
                initTiles.sort(() => Math.random() - 0.5)
                setTiles(initTiles)
                // 重置选中及处理状态
                setFirstSelection(null)
                setSecondSelection(null)
                setProcessing(false)
                // 重置游戏状态为进行中
                setGameStatus("playing")
            })
            .catch(error => {
                console.error(`加载关卡 ${currentLevel} 数据失败：`, error)
            })
    }, [currentLevel])

    // 倒计时计时器，每秒减少1
    useEffect(() => {
        const interval = setInterval(() => {
            setCountDown(prev => (prev > 0 ? prev - 1 : 0))
        }, 1000)
        return () => clearInterval(interval)
    }, [currentLevel])

    // 计算剩余未匹配对数，公式：(行*列/2) - (已匹配对数)
    const computeRemainingPairs = () => {
        if (!levelConfig) return 0
        const totalPairs = (levelConfig.rows * levelConfig.cols) / 2
        const matchedPairs = tiles.filter(tile => tile.isMatched).length / 2
        return totalPairs - matchedPairs
    }

    // 检查游戏结束条件，每当倒计时或卡牌状态变化时执行
    useEffect(() => {
        if (gameStatus === "playing") {
            // 如果倒计时为0且剩余对数不为0，则游戏失败
            if (countDown === 0 && computeRemainingPairs() > 0) {
                setGameStatus("failed")
            }
            // 如果剩余对数为0，则游戏成功（无论倒计时还剩多少）
            if (computeRemainingPairs() === 0) {
                setGameStatus("succeeded")
            }
        }
    }, [countDown, tiles, gameStatus])

    // 点击卡牌时的逻辑
    const handleTileClick = (tile: TileModel) => {
        // 如果游戏已结束或正在处理中，不允许点击
        if (gameStatus !== "playing" || processing) return
        // 忽略已翻开或已匹配的卡牌
        if (tile.isFlipped || tile.isMatched) return

        if (!firstSelection) {
            setFirstSelection(tile)
            setTiles(prev =>
                prev.map(t =>
                    t.id === tile.id ? { ...t, isFlipped: true, hintedColor: undefined } : t
                )
            )
        } else if (!secondSelection) {
            setSecondSelection(tile)
            setTiles(prev =>
                prev.map(t =>
                    t.id === tile.id ? { ...t, isFlipped: true, hintedColor: undefined } : t
                )
            )
            setProcessing(true)
            const firstTile = firstSelection
            const secondTile = tile

            if (firstTile.value === secondTile.value) {
                // 匹配成功
                setTiles(prev =>
                    prev.map(t =>
                        t.id === firstTile.id || t.id === secondTile.id
                            ? { ...t, isMatched: true }
                            : t
                    )
                )
                setTimeout(() => {
                    setFirstSelection(null)
                    setSecondSelection(null)
                    setProcessing(false)
                }, 500)
            } else {
                // 不匹配，保持 800ms 后翻回
                setTimeout(() => {
                    setTiles(prev =>
                        prev.map(t =>
                            t.id === firstTile.id || t.id === secondTile.id
                                ? { ...t, isFlipped: false }
                                : t
                        )
                    )
                    setFirstSelection(null)
                    setSecondSelection(null)
                    setProcessing(false)
                }, 800)
            }
        }
    }

    // 提示按钮点击逻辑：从所有未翻开、未匹配且未提示过的卡牌中随机寻找一对相同牌
    const handleHintClick = () => {
        if (hintCount <= 0 || processing || gameStatus !== "playing") return

        const candidateTiles = tiles.filter(
            tile => !tile.isFlipped && !tile.isMatched && !tile.isHintUsed
        )
        const groups: { [key: string]: TileModel[] } = {}
        candidateTiles.forEach(tile => {
            if (!groups[tile.value]) groups[tile.value] = []
            groups[tile.value].push(tile)
        })
        const candidatePairs: TileModel[][] = []
        for (const key in groups) {
            if (groups[key].length >= 2) {
                const shuffled = groups[key].sort(() => Math.random() - 0.5)
                candidatePairs.push([shuffled[0], shuffled[1]])
            }
        }
        if (candidatePairs.length === 0) return

        const randomPair = candidatePairs[Math.floor(Math.random() * candidatePairs.length)]
        const currentHintColor = hintColors[hintColorIndex % hintColors.length]

        setTiles(prev =>
            prev.map(t => {
                if (t.id === randomPair[0].id || t.id === randomPair[1].id) {
                    return { ...t, isFlipped: true, isHintUsed: true, hintedColor: currentHintColor }
                }
                return t
            })
        )
        setHintCount(prev => prev - 1)
        setHintColorIndex(prev => prev + 1)

        setTimeout(() => {
            setTiles(prev =>
                prev.map(t => {
                    if ((t.id === randomPair[0].id || t.id === randomPair[1].id) && !t.isMatched) {
                        return { ...t, isFlipped: false, hintedColor: undefined }
                    }
                    return t
                })
            )
        }, 2000)
    }

    // 渲染关卡选择按钮列表
    const renderLevelList = () => {
        return (
            <div className="level-list">
                {Array.from({ length: TOTAL_LEVELS }, (_, idx) => idx + 1).map(level => (
                    <button
                        key={level}
                        onClick={() => setCurrentLevel(level)}
                        className={`level-btn ${level === currentLevel ? 'active' : ''}`}
                    >
                        第 {level} 关
                    </button>
                ))}
            </div>
        )
    }

    return (
        <div className="game-page">
            <h1>HeadToToe 对对碰</h1>
            {renderLevelList()}
            <div className="hint-section">
                <button className="hint-btn" onClick={handleHintClick}>
                    提示 ({hintCount})
                </button>
                <div className="info">
                    {gameStatus === "failed" && (
                        <span className="info-item failed">游戏结束</span>
                    )}
                    {gameStatus === "succeeded" && (
                        <span className="info-item succeeded">恭喜通关</span>
                    )}
                    {gameStatus === "playing" && (
                        <span className="info-item">倒计时：{countDown}</span>
                    )}
                    <span className="info-item">剩余对数：{computeRemainingPairs()}</span>
                </div>
            </div>
            {levelConfig && (
                <div className="board" style={{ gridTemplateColumns: `repeat(${levelConfig.cols}, 1fr)` }}>
                    {tiles.map(tile => (
                        <Tile key={tile.id} tile={tile} onClick={handleTileClick} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default GamePage

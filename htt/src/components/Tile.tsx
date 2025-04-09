import React, { useState } from 'react'
import { Tile as TileModel } from '../models/Tile'
import './Tile.css'

interface TileProps {
    tile: TileModel;
    onClick: (tile: TileModel) => void;
}

const Tile: React.FC<TileProps> = ({ tile, onClick }) => {
    const [imgError, setImgError] = useState(false)

    const handleClick = () => {
        if (!tile.isFlipped && !tile.isMatched) {
            onClick(tile)
        }
    }

    // 如果卡牌处于翻开状态且存在提示颜色，则使用提示颜色作为背景
    const tileStyle = (tile.isFlipped && tile.hintedColor)
        ? { backgroundColor: tile.hintedColor }
        : // 如果未翻开、未匹配时存在提示颜色，也显示提示（一般提示后卡牌会翻开，此处为兼容预留）
        (!tile.isFlipped && !tile.isMatched && tile.hintedColor)
            ? { backgroundColor: tile.hintedColor }
            : {}

    const imgSrc = `/HeadToToe/images/${tile.value}.webp`

    return (
        <div
            className={`tile ${tile.isFlipped || tile.isMatched ? 'flipped' : ''}`}
            style={tileStyle}
            onClick={handleClick}
        >
            {(tile.isFlipped || tile.isMatched) && (
                <>
                    {!imgError ? (
                        <img
                            src={imgSrc}
                            alt={tile.value}
                            onError={() => setImgError(true)}
                            className="tile-img"
                        />
                    ) : (
                        <span className="tile-text">{tile.value.toUpperCase()}</span>
                    )}
                </>
            )}
        </div>
    )
}

export default Tile

export interface Tile {
    id: number;
    value: string;
    isFlipped: boolean;
    isMatched: boolean;
    // 标记该卡牌是否已经被提示过（提示功能只允许对每对卡牌使用一次）
    isHintUsed?: boolean;
    // 提示时使用的颜色（仅在提示期间生效，可用于渲染时覆盖背景颜色）
    hintedColor?: string;
}

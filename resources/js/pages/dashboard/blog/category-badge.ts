export function categoryBadgeStyle(color?: string | null) {
    const backgroundColor = color && /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(color) ? color : '#073e32';
    const hex = backgroundColor.slice(1);
    const channels = hex.length === 3 ? [...hex].map((value) => value.repeat(2)) : (hex.match(/../g) ?? []);
    const luminance = channels.reduce((sum, channel, index) => {
        const value = parseInt(channel, 16) / 255;
        const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        return sum + linear * [0.2126, 0.7152, 0.0722][index];
    }, 0);
    const whiteContrast = 1.05 / (luminance + 0.05);
    const blackContrast = (luminance + 0.05) / 0.05;
    return { backgroundColor, color: whiteContrast >= blackContrast ? '#fff' : '#000' };
}

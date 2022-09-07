


export const handleColor = (color) => {
    if (color) {
        const themes = color.split('|')
        var colors = new Map()
        themes.forEach(elem => {
            const tmp = elem.split('#')
            colors.set(tmp[0], tmp[1])
        });

        if (colors.get('light') && colors.get('dark')) {
            return "#" + colors.get('light')
        }
    }
}
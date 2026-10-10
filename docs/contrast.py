"""
曜石智能科技 · 对比度求解器
==========================
按 WCAG 2.1 相对亮度公式，自动推导「达标色值」，不手填、不靠肉眼。

用法：
    python docs/contrast.py           # 求解并打印 CSS 变量
    python docs/contrast.py --check   # 校验 style.css 实际使用的组合

原理：
    对目标色在保持色相不变的前提下，沿亮度轴搜索，
    找到第一个满足目标对比度的色值。
    浅底 → 压暗；深底 → 提亮。
"""

import colorsys


# ---------- WCAG 2.1 相对亮度 ----------

def srgb_to_linear(c):
    c = c / 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgb_to_hex(rgb):
    return '#%02X%02X%02X' % tuple(int(round(c)) for c in rgb)


def luminance(hex_color):
    r, g, b = hex_to_rgb(hex_color)
    return (
        0.2126 * srgb_to_linear(r)
        + 0.7152 * srgb_to_linear(g)
        + 0.0722 * srgb_to_linear(b)
    )


def contrast(fg, bg):
    """对比度，取值范围 1.0 ~ 21.0"""
    l1, l2 = luminance(fg), luminance(bg)
    if l1 < l2:
        l1, l2 = l2, l1
    return (l1 + 0.05) / (l2 + 0.05)


def ratio_str(c):
    return f'{c:.2f}:1'


# ---------- 色相空间求解 ----------

def hex_to_hsl(hex_color):
    r, g, b = [c / 255 for c in hex_to_rgb(hex_color)]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return h * 360, s * 100, l * 100


def hsl_to_hex(h, s, l):
    r, g, b = colorsys.hls_to_rgb(h / 360, l / 100, s / 100)
    return rgb_to_hex((r * 255, g * 255, b * 255))


def solve(fg, bg, target, direction=None, max_steps=220):
    """
    保持色相与饱和度，沿明度轴搜索首个满足 target 的色值。

    direction:
        'auto'  依背景亮度自动判断（浅底压暗、深底提亮）
        'darker' 强制压暗
        'lighter' 强制提亮
    返回 None 表示该方向上无解（已到黑或白）。
    """
    if contrast(fg, bg) >= target:
        return fg, contrast(fg, bg)

    h, s, l = hex_to_hsl(fg)

    if direction is None:
        bg_l = luminance(bg)
        direction = 'darker' if bg_l > 0.35 else 'lighter'

    if direction == 'darker':
        steps = [l - i * (l / max_steps) for i in range(max_steps)]
    else:
        steps = [l + i * ((100 - l) / max_steps) for i in range(max_steps)]

    for nl in steps:
        if nl < 0 or nl > 100:
            break
        cand = hsl_to_hex(h, s, nl)
        if contrast(cand, bg) >= target:
            return cand, contrast(cand, bg)

    # 退到纯黑或纯白
    extreme = '#000000' if direction == 'darker' else '#FFFFFF'
    if contrast(extreme, bg) >= target:
        return extreme, contrast(extreme, bg)
    return None, contrast(extreme, bg)


# ---------- V1.1 规范色值 ----------

BRAND = {
    # §3.1 深色 5 级
    'night':    '#02020A',
    'deep':     '#0B1F3A',
    'slate':    '#16294A',   # V1.1.1 已修正（原 #12233F 与石墨灰亮度差仅 0.0009）
    'graphite': '#1C2530',
    'metal':    '#1E2A44',
    # §3.2 强调色
    'cyan':     '#00D4B8',
    'purple':   '#7B2FFF',
    # §3.3 紫色阶梯
    'purple-d': '#2E1065',
    'purple-m': '#3B1D8A',
    'purple-l': '#A855F7',
    'purple-p': '#E9D5FF',
    # §3.4 辅助
    'cloud':    '#F5F7FA',
    'steel':    '#6E7B91',
    'success':  '#2ECC8F',
    'warn':     '#FF7A45',
    'danger':   '#E74C3C',
    'gold':     '#C8A84B',
}

# 待求解的配对：(标签, 前景, 背景, 目标, 方向, 用途)
TASKS = [
    # --- 规范 §3.7 明文要求 ---
    ('on-deep-cyan',    'cyan',       'deep', 4.5, 'lighter', '深空蓝底青色文字'),
    ('on-deep-purple',  'purple',     'deep', 4.0, 'lighter', '深空蓝底紫字(大字号)'),
    ('on-deep-bright',  'purple-l',   'deep', 4.5, 'lighter', '深空蓝底亮紫正文'),
    ('on-cloud-deep',   'deep',       'cloud', 7.0, None,      '浅底深空蓝正文'),
    ('on-cloud-steel',  'steel',      'cloud', 4.5, 'darker',  '浅底钢灰次要文字'),
    ('on-palepurple',   'purple-d',   'purple-p', 4.5, None,   '浅紫标签文字'),

    # --- 规范未覆盖但必然用到 ---
    ('on-cloud-cyan',   'cyan',       'cloud', 4.5, 'darker',  '浅底青色链接/次按钮'),
    ('on-cloud-purple', 'purple',     'cloud', 4.5, 'darker',  '浅底紫字'),
    ('on-slate-cyan',   'cyan',       'slate', 4.5, 'lighter', '蓝灰底青字'),
    ('on-slate-purple', 'purple',     'slate', 4.0, 'lighter', '蓝灰底紫字(大字号)'),
    ('on-night-cyan',   'cyan',       'night', 4.5, 'lighter', '极夜蓝底青字'),
    ('on-night-purple', 'purple',     'night', 4.0, 'lighter', '极夜蓝底紫字(大字号)'),
    ('on-graphite-steel', 'steel',    'graphite', 4.5, 'lighter', '石墨灰底钢灰文字'),
    ('on-deep-steel',   'steel',      'deep', 4.5, 'lighter', '深空蓝底钢灰文字'),
    ('on-graphite-purple', 'purple',  'graphite', 4.0, 'lighter', '石墨灰底紫字(大字号)'),
    ('on-night-steel',  'steel',      'night', 4.5, 'lighter', '极夜蓝底钢灰文字'),

    # --- 状态色作文字 ---
    ('on-cloud-success', 'success',   'cloud', 4.5, 'darker',  '浅底成功态文字'),
    ('on-cloud-warn',    'warn',      'cloud', 4.5, 'darker',  '浅底警告态文字'),
    ('on-cloud-danger',  'danger',    'cloud', 4.5, 'darker',  '浅底错误态文字'),
    ('on-cloud-gold',    'gold',      'cloud', 4.5, 'darker',  '浅底金色文字'),
    ('on-deep-gold',     'gold',      'deep', 4.5, None,      '深底金色文字'),
    ('on-graphite-success', 'success', 'graphite', 4.5, None,   '石墨灰底成功态'),
    ('on-graphite-warn',    'warn',    'graphite', 4.5, None,   '石墨灰底警告态'),
    ('on-graphite-danger',  'danger',  'graphite', 4.5, None,   '石墨灰底错误态'),
]


def main():
    print('=' * 78)
    print('曜石智能科技 · 对比度自动求解')
    print('=' * 78)

    solved = {}
    failures = []

    for key, fg, bg, target, direction, usage in TASKS:
        fg_hex, bg_hex = BRAND[fg], BRAND[bg]
        original = contrast(fg_hex, bg_hex)
        new_hex, actual = solve(fg_hex, bg_hex, target, direction)

        if new_hex is None:
            failures.append((key, usage))
            print(f'  [无解] {key}: {fg_hex} / {bg_hex} 无法达到 {target}:1')
            continue

        status = '原色已达标' if new_hex == fg_hex else f'修正 {original:.2f} →'
        flag = 'PASS' if actual >= target else 'FAIL'
        if actual < target:
            failures.append((key, usage))

        solved[key] = new_hex

        print(f'  {key:20} {fg_hex}/{bg_hex} → {new_hex}  需≥{target}:1  '
              f'实测 {ratio_str(actual)}  [{flag}]')
        print(f'  {"":20} {status:22} {usage}')

    print()
    print('=' * 78)
    print('求解结果 → CSS 变量')
    print('=' * 78)

    groups = {
        '深底文字（深空蓝 / 蓝灰 / 石墨灰 / 极夜蓝）': [
            'on-deep-cyan', 'on-deep-purple', 'on-deep-bright', 'on-deep-steel',
            'on-slate-cyan', 'on-slate-purple', 'on-graphite-steel',
            'on-graphite-purple', 'on-night-cyan', 'on-night-purple',
            'on-night-steel',
        ],
        '浅底文字（云白 / 淡紫）': [
            'on-cloud-deep', 'on-cloud-steel', 'on-cloud-cyan',
            'on-cloud-purple', 'on-palepurple',
        ],
        '状态色文字': [
            'on-cloud-success', 'on-cloud-warn', 'on-cloud-danger', 'on-cloud-gold',
            'on-deep-gold', 'on-graphite-success', 'on-graphite-warn',
            'on-graphite-danger',
        ],
    }

    for title, keys in groups.items():
        print(f'\n  /* {title} */')
        for k in keys:
            if k in solved:
                print(f'  --{k.replace("-", "-"):24} {solved[k]};')

    print()
    print('=' * 78)
    if failures:
        print(f'结论：{len(failures)} 项无解，需人工调整')
        for k, u in failures:
            print(f'  - {k}：{u}')
    else:
        print('结论：全部组合达标')


if __name__ == '__main__':
    main()
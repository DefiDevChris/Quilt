import re

with open('tests/unit/stores/layoutStore.test.ts', 'r') as f:
    content = f.read()

content = content.replace("expect(borders[0].color).toBe('#2D2D2D');", "expect(borders[0].color).toBe('#4a3f35');")

with open('tests/unit/stores/layoutStore.test.ts', 'w') as f:
    f.write(content)

import re

with open('renderForm.test.js', 'r') as f:
    content = f.read()

# Replace `app.parseVariables(X)` with `app.setVariables(app.parseVariables(X))`
# Use regex to find exactly app.parseVariables(...)
content = re.sub(r"app\.parseVariables\('([^']+)'\);", r"app.setVariables(app.parseVariables('\1'));", content)

# There is one instance of `const vars = app.parseVariables('[TEST_VAR]');`
content = content.replace("const vars = app.parseVariables('[TEST_VAR]');", "const vars = app.parseVariables('[TEST_VAR]');\n        app.setVariables(vars);")

with open('renderForm.test.js', 'w') as f:
    f.write(content)

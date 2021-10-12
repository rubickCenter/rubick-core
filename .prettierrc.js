module.exports = {
	// 最大长度80个字符
	printWidth: 80,
	// 行末分号
	semi: false,
	// 单引号
	singleQuote: true,
	// 尽可能使用尾随逗号（包括函数参数）
	trailingComma: "none",
	// 在对象文字中打印括号之间的空格。
	bracketSpacing: true,
	// 箭头圆括号
	arrowParens: "avoid",
	// 在文件顶部插入一个特殊的 @format 标记，指定文件格式需要被格式化。
	insertPragma: false,
	// 缩进
	tabWidth: 2,
	// 使用tab还是空格
	useTabs: false,
	// 行尾换行格式
	endOfLine: "auto",
	HTMLWhitespaceSensitivity: "ignore",
	extends: [
		"eslint:recommended",
		//避免与 prettier 冲突
		"plugin:prettier/recommended",
	]
}

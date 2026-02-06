技术栈

使用 better-auth + bun.sqlite + drizzle 初始化必要的数据库。

之后开始插入测试用的数：
初始化账户

| Role       | Last Name | First Name | Gender | Phone       | PIN  | Password | Family ID  | Description          |
| :--------- | :-------- | :--------- | :----- | :---------- | :--- | :------- | :--------- | :------------------- |
| **admin**  | -         | admin      | Male   | 13800000001 | -    | 1111     | -          | System Administrator |
| **parent** | Zhang     | 1          | Male   | 13800000100 | -    | 1111     | family-001 | Family 1 (Primary)   |
| **parent** | Zhang     | 2          | Male   | 12800000200 | -    | 1111     | family-001 | Family 1 (Secondary) |
| **child**  | Zhang     | 3          | Male   | -           | 1111 | -        | family-001 | Family 1 (Child)     |
| **parent** | Li        | 1          | Male   | 13800000300 | -    | 1111     | family-002 | Family 2 (Primary)   |
| **parent** | Li        | 2          | Male   | 13800000400 | -    | 1111     | family-002 | Family 2 (Secondary) |

计划任务创建界面，表单项：

- 设为模板（only admin）checkbox
- 计划名称 2-20个字符，必填
- 描述 2-200个字符 非必填
- 任务名称 2-20个字符，必填
- 分类 select 非必填，目前想到的值为 学习，家务，行为
- 基础奖励 数字，必填，可为负数
- 任务对象 可选，多选，只有家长可填，也即勾选设为模板时，不可填写。admin指定某个家庭使用的计划任务为模板的时候，这个要清空。select，可选值为家庭成员，儿童排在前面，可多选
- 图标 必填，使用 components/image-picker
- 日期范围 勾选设为模板时，可选，否则必填
- 日期策略，必填，select，下拉选框的值为：如果角色是管理员，则是管理员设为公开的日期策略；如果角色是家长，则是家长创建的日期策略
- 开启连击 checkbox，可选。若勾选：
  - 连击策略：
    - 线性
      - 最少次数 数字输入框，必填，只能是非0正整数
      - 最多次数 数字输入框，必填，只能是非0正整数，且必须大于最少次数
      - 奖励积分 数字输入框，必填，非0整数，可以为负
    - 阶梯
      - 线性连击策略的多个条目
      - 后面每个阶梯的最少次数必须为上个的最多次数+1
- 徽章 select，值的范围：若为admin，则为管理员设置的公开的徽章；若为家长，则是家长创建的徽章
- 任务类型 必填，select，枚举值：日常，隐藏
- 年龄建议 勾选设为模板后显示，两个数字输入框，后者要比前者大。
- 设为公开 勾选设为模板后显示，checkbox

- 表单保存的时候，校验逻辑：如果没有勾选设为模板，校验日期范围和日期策略有没有重合，没有重合的话提示用户：所选日期范围和日期策略没有重合，不会产生任务，确定保存吗。用户点击确定，则继续保存，点击取消，则停留在当前页面。

表字段：

- id
- isTemplate
- familyId 可以为 null，因为是管理员创建的。如果 family 的状态设置为 suspended或则deleted，则任务也要设置为suspended或则deleted
- name
- description
- taskName
- category
- points
  // 下面四个字段都是 components/image-picker 的返回值
- imageType icon|upload
- color string
- image string
- borderStyle string
- status 计划任务状态，active，suspend，noTask，deleted, noExecutor，published（模板设为公开），unpublished（模板非公开）
- createdBy
- createdAt
- updatedAt
- templateId: 家长复制一个公开模板的时候，所复制的模板id

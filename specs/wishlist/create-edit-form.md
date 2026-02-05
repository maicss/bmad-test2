
愿望单表单

- 名称 必填 2-50个字符
- 描述 非必填 0-200个字符
- 模板，checkbox，只有管理员可见
- 类型 select 必选 可选值：大餐、零食、快餐、虚拟物品、玩具、书籍、电子产品、陪伴、运动、旅行
- 激活 checkbox 如果是模板，不可激活，禁用+unchecked
- 所需分数 如果是激活，必填，否者非必填 非负整数
- 截止日期 可选
- 对象 select 家庭成员，如果是模板，不可选择，清空已选的值。如果不是模板，激活为false，非必填，激活为true，必填
- 图标 image-selector 组件
- 备注 非必填 0-200个字符

表字段

id
family_id 可为空，因为可能是管理员创建的
created_by 创建者，可为管理员，家长，儿童的id
title 
description
type
points
  // 下面四个字段都是 components/image-picker 的返回值
- imageType icon|upload
- color string
- image string
- borderStyle string

approved_by 场景是儿童提出愿望，家长批准，这个必须是家长id或者null
approved_at
redeemed_at
redeemed_confirmed_by
remark
created_at
updated_at
template_id 复制自管理员创建的某个模板，此为这个模板的id

is_template
status published|unpublished|activated|ready

import { $ } from "bun";

async function checkBranch() {
  try {
    const branchName = (await $`git branch --show-current`.quiet()).text().trim();
    
    if (!branchName) {
      console.error("❌ 无法获取当前 Git 分支。这是在一个 Git 仓库中吗？");
      process.exit(1);
    }

    const featureRegex = /^feature\/story-\d+-\d+-.*$/;
    const experimentRegex = /^experiment-.*$/;
    const forbiddenExact = ['main', 'fix-e2e'];

    // 如果当前分支合规，直接放行
    if (!forbiddenExact.includes(branchName) && !branchName.startsWith('hotfix-') && 
        (featureRegex.test(branchName) || experimentRegex.test(branchName))) {
      console.log(`✅ 当前分支 '${branchName}' 符合规范。允许开发。`);
      process.exit(0);
    }

    // 走到这里说明当前分支不合规，先输出警告
    console.error(`❌ 当前分支名称 '${branchName}' 不符合强制的命名规范或为保护分支。`);
    console.log('🔍 正在查找本地或远端最近活动过且符合规范的分支...');

    try {
      // 获取所有分支，按提交时间排序，最近的排在前面
      const branchesOutput = (await $`git for-each-ref --sort=-committerdate refs/heads/ refs/remotes/ --format="%(refname:short)"`.quiet()).text();
      const branches = branchesOutput.split('\n').map(b => b.trim()).filter(Boolean);
      
      let targetBranch = '';
      for (const branch of branches) {
        const cleanBranch = branch.replace(/^origin\//, '');
        // 确保匹配我们要求的前缀，且不和当前所在的不合规分支相同
        if ((featureRegex.test(cleanBranch) || experimentRegex.test(cleanBranch)) && cleanBranch !== branchName) {
          targetBranch = cleanBranch;
          break;
        }
      }

      if (targetBranch) {
        console.log(`💡 发现符合规范的最近活动分支: ${targetBranch}，正在尝试自动切换...`);
        try {
          // 如果有挂起的更变可能会 checkout 失败
          await $`git checkout ${targetBranch}`.quiet();
          console.log(`✅ 已成功自动切换到分支: ${targetBranch}`);
          console.log(`✅ 规范验证通过，允许开发。`);
          process.exit(0);
        } catch {
          console.error(`❌ 自动切换到 ${targetBranch} 失败。可能有未提交的更改导致冲突。`);
          console.error(`ℹ️ 请手动 stash 或 commit 更改后运行: git checkout ${targetBranch}`);
        }
      } else {
        console.log(`⚠️ 未找到符合要求的现存规范分支。`);
      }
    } catch (e) {
      console.log(`查找分支时发现错误: ${e}`);
    }

    console.error('----------------------------------------------------');
    console.error('【操作指南】');
    console.error('1. 您必须在功能开发分支上工作');
    console.error('2. 功能开发分支必须遵循格式: feature/story-{Epic}-{Story}-{description}');
    console.error('3. 正确示例: feature/story-2-9-child-marks-task-complete');
    console.error('4. 您可以使用以下命令创建新分支:');
    console.error('   git checkout main && git checkout -b feature/story-X-Y-name');
    console.error('----------------------------------------------------');
    process.exit(1);

  } catch (error) {
    console.error("执行 Git 命令时失败: ", error);
    process.exit(1);
  }
}

checkBranch();

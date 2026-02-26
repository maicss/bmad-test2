export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Tailwind CSS 测试页面
      </h1>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-teal-600 mb-2">
            ✅ text-xl font-semibold text-teal-600
          </h2>
          <p className="text-gray-600">
            如果看到绿色粗体标题，说明 Tailwind CSS 工作正常！
          </p>
        </div>

        <div className="bg-blue-500 text-white p-4 rounded-lg">
          <h2 className="text-lg font-bold">
            ✅ bg-blue-500 text-white
          </h2>
          <p>蓝色背景，白色文字</p>
        </div>

        <div className="bg-primary text-white p-4 rounded-lg">
          <h2 className="text-lg font-bold">
            ✅ bg-primary text-white (自定义 primary 颜色)
          </h2>
          <p>主色背景（绿色），白色文字</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-500 p-4 text-white rounded font-bold">红</div>
          <div className="bg-green-500 p-4 text-white rounded font-bold">绿</div>
          <div className="bg-blue-500 p-4 text-white rounded font-bold">蓝</div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded">
        <p className="font-semibold text-yellow-800">🔍 验证清单：</p>
        <ul className="mt-2 list-disc list-inside text-yellow-700">
          <li>大标题应该是粗体且很大（text-2xl font-bold）</li>
          <li>第一个卡片白色背景，绿色标题</li>
          <li>第二个卡片蓝色背景，白色文字</li>
          <li>第三个卡片主色（绿色）背景</li>
          <li>底部三个色块：红、绿、蓝</li>
          <li>所有间距应该正常（space-y-4, p-4, p-8）</li>
        </ul>
      </div>
    </div>
  );
}

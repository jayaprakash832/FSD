document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "trackwise-expenses"

  const categories = [
    { id: "food", name: "Food & Dining", color: "#ef4444", icon: "🍽️" },
    { id: "transport", name: "Transportation", color: "#3b82f6", icon: "🚗" },
    { id: "shopping", name: "Shopping", color: "#8b5cf6", icon: "🛍️" },
    { id: "entertainment", name: "Entertainment", color: "#f59e0b", icon: "🎬" },
    { id: "utilities", name: "Bills & Utilities", color: "#10b981", icon: "⚡" },
    { id: "health", name: "Healthcare", color: "#ec4899", icon: "💊" },
    { id: "education", name: "Education", color: "#6366f1", icon: "📚" },
    { id: "travel", name: "Travel", color: "#14b8a6", icon: "✈️" },
    { id: "groceries", name: "Groceries", color: "#f97316", icon: "🛒" },
    { id: "other", name: "Other", color: "#64748b", icon: "📦" },
  ]

  const defaultExpenses = [
    { id: "1", description: "Coffee + croissant", amount: 8.5, categoryId: "food", date: offsetDate(2), notes: "Morning pickup" },
    { id: "2", description: "Ride to office", amount: 12.75, categoryId: "transport", date: offsetDate(6), notes: "Rainy day" },
    { id: "3", description: "Online course", amount: 64, categoryId: "education", date: offsetDate(18), notes: "SQL mastery" },
    { id: "4", description: "Groceries", amount: 92.2, categoryId: "groceries", date: offsetDate(12), notes: "Weekly stock" },
    { id: "5", description: "Streaming subscription", amount: 14.99, categoryId: "entertainment", date: offsetDate(25), notes: "Monthly" },
    { id: "6", description: "Electricity bill", amount: 88.4, categoryId: "utilities", date: offsetDate(33), notes: "Auto-pay" },
    { id: "7", description: "Flight booking", amount: 220.5, categoryId: "travel", date: offsetDate(48), notes: "Client visit" },
    { id: "8", description: "New sneakers", amount: 110.0, categoryId: "shopping", date: offsetDate(54), notes: "Workouts" },
    { id: "9", description: "Pharmacy", amount: 28.35, categoryId: "health", date: offsetDate(8), notes: "Supplements" },
  ]

  const summaryMonth = document.getElementById("summary-this-month")
  const summaryTotal = document.getElementById("summary-total")
  const summaryAvg = document.getElementById("summary-average")
  const summaryLast = document.getElementById("summary-last-month")
  const summaryMom = document.getElementById("summary-mom")
  const summaryCount = document.getElementById("summary-count")

  const monthFilter = document.getElementById("filter-month")
  const categoryFilter = document.getElementById("filter-category")

  const barsContainer = document.getElementById("monthly-bars")
  const categoryList = document.getElementById("category-list")
  const dailyLine = document.getElementById("daily-line")
  const dailyArea = document.getElementById("daily-area")
  const dailyEmpty = document.getElementById("daily-empty")

  const tableBody = document.getElementById("expense-tbody")

  const modal = document.getElementById("expense-modal")
  const modalTitle = document.getElementById("modal-title")
  const modalForm = document.getElementById("expense-form")
  const descInput = document.getElementById("exp-description")
  const amountInput = document.getElementById("exp-amount")
  const categoryInput = document.getElementById("exp-category")
  const dateInput = document.getElementById("exp-date")
  const notesInput = document.getElementById("exp-notes")
  const addBtn = document.getElementById("add-expense-btn")
  const closeBtn = document.getElementById("close-modal")
  const cancelBtn = document.getElementById("cancel-modal")
  const toast = document.getElementById("toast")

  let expenses = loadExpenses()
  let editingId = null

  renderFilters()
  renderSelectOptions()
  renderAll()
  revealOnLoad()

  addBtn?.addEventListener("click", () => openModal())
  closeBtn?.addEventListener("click", closeModal)
  cancelBtn?.addEventListener("click", closeModal)

  monthFilter?.addEventListener("change", renderTable)
  categoryFilter?.addEventListener("change", renderTable)

  modalForm?.addEventListener("submit", (e) => {
    e.preventDefault()
    const payload = {
      description: descInput.value.trim(),
      amount: parseFloat(amountInput.value),
      categoryId: categoryInput.value,
      date: dateInput.value,
      notes: notesInput.value.trim(),
    }

    if (!payload.description || !payload.amount || !payload.categoryId || !payload.date) {
      showToast("Please fill all required fields")
      return
    }

    if (editingId) {
      expenses = expenses.map((exp) =>
        exp.id === editingId ? { ...exp, ...payload } : exp
      )
      showToast("Expense updated")
    } else {
      expenses.unshift({
        id: cryptoId(),
        ...payload,
      })
      showToast("Expense added")
    }

    saveExpenses(expenses)
    closeModal()
    renderAll()
  })

  tableBody?.addEventListener("click", (e) => {
    const target = e.target
    const editBtn = target.closest("[data-action='edit']")
    const deleteBtn = target.closest("[data-action='delete']")
    if (editBtn) {
      const id = editBtn.getAttribute("data-id")
      const expense = expenses.find((exp) => exp.id === id)
      if (expense) openModal(expense)
    }
    if (deleteBtn) {
      const id = deleteBtn.getAttribute("data-id")
      const expense = expenses.find((exp) => exp.id === id)
      if (!expense) return
      if (confirm(`Delete ${expense.description}?`)) {
        expenses = expenses.filter((exp) => exp.id !== id)
        saveExpenses(expenses)
        renderAll()
        showToast("Expense removed")
      }
    }
  })

  function renderAll() {
    renderSummary()
    renderCharts()
    renderTable()
  }

  function renderSummary() {
    const now = new Date()
    const thisMonthKey = toMonthKey(now)
    const lastMonthKey = toMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1))

    const total = sumExpenses(expenses)
    const thisMonth = sumExpenses(expenses.filter((exp) => toMonthKey(exp.date) === thisMonthKey))
    const lastMonth = sumExpenses(expenses.filter((exp) => toMonthKey(exp.date) === lastMonthKey))
    const count = expenses.length
    const avg = count ? total / count : 0
    const mom = lastMonth ? ((thisMonth - lastMonth) / lastMonth) * 100 : thisMonth ? 100 : 0

    summaryMonth.textContent = formatCurrency(thisMonth)
    summaryTotal.textContent = formatCurrency(total)
    summaryAvg.textContent = formatCurrency(avg)
    summaryLast.textContent = formatCurrency(lastMonth)
    summaryCount.textContent = `${count} expenses logged`
    summaryMom.textContent = `${mom >= 0 ? "+" : ""}${mom.toFixed(1)}% vs last month`
    summaryMom.style.color = mom >= 0 ? "#ef4444" : "#0f766e"
  }

  function renderCharts() {
    renderMonthlyBars()
    renderCategoryBreakdown()
    renderDailyChart()
  }

  function renderMonthlyBars() {
    const months = lastSixMonths()
    const totals = months.map((m) => sumExpenses(expenses.filter((exp) => toMonthKey(exp.date) === m.key)))
    const max = Math.max(...totals, 1)

    barsContainer.innerHTML = ""
    totals.forEach((total, index) => {
      const bar = document.createElement("div")
      bar.className = "bar"
      const value = total ? total / max : 0.05
      bar.style.setProperty("--value", value.toString())
      const label = document.createElement("span")
      label.textContent = months[index].label
      bar.appendChild(label)
      barsContainer.appendChild(bar)
    })
  }

  function renderCategoryBreakdown() {
    const total = sumExpenses(expenses)
    const grouped = categories.map((cat) => {
      const catTotal = sumExpenses(expenses.filter((exp) => exp.categoryId === cat.id))
      return { ...cat, total: catTotal }
    }).filter((item) => item.total > 0)

    categoryList.innerHTML = ""

    grouped.forEach((item) => {
      const percent = total ? (item.total / total) * 100 : 0
      const wrapper = document.createElement("div")
      wrapper.className = "category-item"

      const left = document.createElement("div")
      const label = document.createElement("div")
      label.className = "chip"
      label.style.background = `${item.color}22`
      label.style.color = item.color
      label.textContent = `${item.icon} ${item.name}`

      const progress = document.createElement("div")
      progress.className = "progress"
      const progressBar = document.createElement("span")
      progressBar.style.width = `${percent.toFixed(0)}%`
      progressBar.style.background = item.color
      progress.appendChild(progressBar)

      left.appendChild(label)
      left.appendChild(progress)

      const amount = document.createElement("div")
      amount.style.fontFamily = '"DM Mono", monospace'
      amount.textContent = formatCurrency(item.total)

      wrapper.appendChild(left)
      wrapper.appendChild(amount)
      categoryList.appendChild(wrapper)
    })

    if (!grouped.length) {
      categoryList.innerHTML = "<p class='muted'>Add expenses to see category insights.</p>"
    }
  }

  function renderDailyChart() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const days = new Date(year, month + 1, 0).getDate()

    const totals = []
    for (let day = 1; day <= days; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const total = sumExpenses(expenses.filter((exp) => exp.date === dateKey))
      totals.push(total)
    }

    const max = Math.max(...totals, 1)
    const width = 600
    const height = 180

    const points = totals.map((value, index) => {
      const x = (index / (days - 1)) * width
      const y = height - (value / max) * (height - 20) - 10
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })

    dailyLine.setAttribute("points", points.join(" "))
    const areaPath = `M 0 ${height} L ${points.join(" L ")} L ${width} ${height} Z`
    dailyArea.setAttribute("d", areaPath)

    const hasData = totals.some((t) => t > 0)
    dailyEmpty.style.display = hasData ? "none" : "block"
  }

  function renderTable() {
    const filtered = applyFilters()
    tableBody.innerHTML = ""

    if (!filtered.length) {
      tableBody.innerHTML = "<tr><td colspan='5' class='muted'>No expenses found.</td></tr>"
      return
    }

    filtered.forEach((exp) => {
      const cat = categories.find((c) => c.id === exp.categoryId)
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${exp.description}<div class='muted'>${exp.notes || ""}</div></td>
        <td><span class='chip' style='background:${cat.color}22; color:${cat.color};'>${cat.icon} ${cat.name}</span></td>
        <td>${formatDate(exp.date)}</td>
        <td style='font-family:"DM Mono", monospace;'>${formatCurrency(exp.amount)}</td>
        <td>
          <div class='actions'>
            <button class='action-btn' data-action='edit' data-id='${exp.id}'>Edit</button>
            <button class='action-btn delete' data-action='delete' data-id='${exp.id}'>Delete</button>
          </div>
        </td>
      `
      tableBody.appendChild(tr)
    })
  }

  function applyFilters() {
    const monthValue = monthFilter?.value || "all"
    const categoryValue = categoryFilter?.value || "all"

    return expenses
      .filter((exp) => (monthValue === "all" ? true : toMonthKey(exp.date) === monthValue))
      .filter((exp) => (categoryValue === "all" ? true : exp.categoryId === categoryValue))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  function renderFilters() {
    const months = lastSixMonths()
    monthFilter.innerHTML = "<option value='all'>All months</option>"
    months.forEach((month) => {
      const option = document.createElement("option")
      option.value = month.key
      option.textContent = month.label
      monthFilter.appendChild(option)
    })
  }

  function renderSelectOptions() {
    categoryInput.innerHTML = "<option value=''>Select category</option>"
    categoryFilter.innerHTML = "<option value='all'>All categories</option>"
    categories.forEach((cat) => {
      const opt = document.createElement("option")
      opt.value = cat.id
      opt.textContent = `${cat.icon} ${cat.name}`
      categoryInput.appendChild(opt)

      const filterOpt = document.createElement("option")
      filterOpt.value = cat.id
      filterOpt.textContent = cat.name
      categoryFilter.appendChild(filterOpt)
    })
  }

  function openModal(expense) {
    editingId = expense?.id || null
    modalTitle.textContent = editingId ? "Edit Expense" : "Add Expense"
    descInput.value = expense?.description || ""
    amountInput.value = expense?.amount || ""
    categoryInput.value = expense?.categoryId || ""
    dateInput.value = expense?.date || new Date().toISOString().split("T")[0]
    notesInput.value = expense?.notes || ""
    modal.classList.add("active")
  }

  function closeModal() {
    modal.classList.remove("active")
  }

  function loadExpenses() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return defaultExpenses
      }
    }
    saveExpenses(defaultExpenses)
    return defaultExpenses
  }

  function saveExpenses(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }

  function showToast(message) {
    toast.textContent = message
    toast.classList.add("show")
    setTimeout(() => toast.classList.remove("show"), 2000)
  }

  function sumExpenses(list) {
    return list.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value)
  }

  function formatDate(value) {
    const date = new Date(value)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  function toMonthKey(value) {
    const date = new Date(value)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  }

  function lastSixMonths() {
    const now = new Date()
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        key: toMonthKey(d),
        label: d.toLocaleDateString("en-US", { month: "short" }),
      })
    }
    return months
  }

  function cryptoId() {
    return (crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`)
  }

  function revealOnLoad() {
    document.querySelectorAll(".reveal").forEach((el, index) => {
      setTimeout(() => el.classList.add("is-visible"), 120 + index * 80)
    })
  }

  function offsetDate(daysAgo) {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    return date.toISOString().split("T")[0]
  }
})

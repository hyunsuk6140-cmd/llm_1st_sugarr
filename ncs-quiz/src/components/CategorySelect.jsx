function CategorySelect({ categories, selectedCategory, onSelectCategory }) {
  return (
    <section className="category-panel" aria-label="문제 영역 선택">
      <div className="section-heading">
        <h2>영역 선택</h2>
        <p>전체 또는 원하는 NCS 영역을 선택하세요.</p>
      </div>

      <div className="category-list" role="list">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={category === selectedCategory ? "active" : ""}
            onClick={() => onSelectCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </section>
  );
}

export default CategorySelect;

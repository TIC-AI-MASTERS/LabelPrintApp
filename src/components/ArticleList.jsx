import React, { useState } from 'react';
import { Search } from 'lucide-react';

export function ArticleList({ articles, selection, onSelect, onTogglePermanent }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = articles.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="article-list-container">
      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search articles..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="list-items">
        {filtered.map(article => {
          const qty = selection[article.id] || 0;
          return (
            <div key={article.id} className={`article-item ${qty > 0 ? 'selected' : ''}`}>
              <div className="article-main">
                <div className="article-info">
                  <span className="article-name">{article.name}</span>
                  <span className="article-sku">{article.sku}</span>
                  {article.price && <span className="article-price">€ {article.price.toFixed(2)}</span>}
                </div>
                <div className="article-actions">
                  <input
                    type="number"
                    min="0"
                    value={qty}
                    onChange={(e) => onSelect(article.id, parseInt(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="qty-input"
                  />
                  <span className="label-text">labels</span>
                </div>
              </div>

              <div className="article-options">
                <label className="perm-toggle">
                  <input
                    type="checkbox"
                    checked={article.isPermanent}
                    onChange={(e) => onTogglePermanent && onTogglePermanent(article.id, e.target.checked)}
                  />
                  <span className="toggle-label">Permanent / Sticker</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .article-list-container {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .search-bar {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 6px;
          margin-bottom: 1rem;
        }
        .search-icon {
          color: #888;
          margin-right: 8px;
        }
        .search-bar input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 14px;
        }
        .list-items {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .label-text {
          font-size: 11px;
          color: #666;
        }
        .article-item {
          display: flex;
          flex-direction: column; /* Stack main row and options row */
          gap: 8px;
          padding: 10px;
          border-radius: 6px;
          background: #fff;
          border: 1px solid #eee;
          transition: all 0.2s;
        }
        .article-main {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }
        .article-price {
            font-size: 11px;
            color: #16a34a;
            font-weight: 500;
        }
        .article-options {
            width: 100%;
            padding-top: 5px;
            border-top: 1px solid #f0f0f0;
        }
        .perm-toggle {
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            font-size: 12px;
            color: #444;
            user-select: none;
        }
        .perm-toggle input {
            cursor: pointer;
        }
      `}</style>
    </div>
  );
}

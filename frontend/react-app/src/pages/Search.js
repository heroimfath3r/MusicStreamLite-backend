import React, { useState, useEffect } from 'react';
import { searchAPI } from '../services/api.js';
import './Search.css';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchResults, setSearchResults] = useState({
    songs: [],
    artists: [],
    albums: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Realizar búsqueda cuando cambia el query
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery || searchQuery.trim().length === 0) {
        setSearchResults({ songs: [], artists: [], albums: [] });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await searchAPI.searchAll(searchQuery);

        if (response.success) {
          setSearchResults(response.results);
        } else {
          setError('Error al realizar la búsqueda');
        }
      } catch (err) {
        console.error('Error en búsqueda:', err);
        setError('Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    };

    // Debounce: esperar 500ms después de que el usuario deje de escribir
    const timeoutId = setTimeout(performSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Buscar</h1>
        <div className="search-box">
          <input
            type="text"
            placeholder="Artistas, canciones o álbumes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-large"
          />
          <button className="search-btn-large">
            {loading ? '⏳' : '🔍'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{
          padding: '20px',
          margin: '20px 0',
          backgroundColor: '#ff4444',
          color: 'white',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {searchQuery && !loading && (
        <div className="search-results">
          <div className="results-tabs">
            <button
              className={`tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              Todo
            </button>
            <button
              className={`tab ${activeTab === 'songs' ? 'active' : ''}`}
              onClick={() => setActiveTab('songs')}
            >
              Canciones ({searchResults.songs?.length || 0})
            </button>
            <button
              className={`tab ${activeTab === 'artists' ? 'active' : ''}`}
              onClick={() => setActiveTab('artists')}
            >
              Artistas ({searchResults.artists?.length || 0})
            </button>
            <button
              className={`tab ${activeTab === 'albums' ? 'active' : ''}`}
              onClick={() => setActiveTab('albums')}
            >
              Álbumes ({searchResults.albums?.length || 0})
            </button>
          </div>

          <div className="results-content">
            {(activeTab === 'all' || activeTab === 'songs') && (
              <div className="results-section">
                <h3>Canciones</h3>
                {searchResults.songs && searchResults.songs.length > 0 ? (
                  searchResults.songs.map(song => (
                    <div key={song.id} className="result-item">
                      <div className="song-info">
                        <div className="song-cover"></div>
                        <div className="song-details">
                          <h4>{song.title}</h4>
                          <p>{song.artist_name || 'Artista desconocido'}</p>
                        </div>
                      </div>
                      <span className="song-duration">{song.duration || 'N/A'}</span>
                      <button className="play-btn-small">▶</button>
                    </div>
                  ))
                ) : (
                  <p style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                    No se encontraron canciones
                  </p>
                )}
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'artists') && (
              <div className="results-section">
                <h3>Artistas</h3>
                {searchResults.artists && searchResults.artists.length > 0 ? (
                  <div className="artists-grid">
                    {searchResults.artists.map(artist => (
                      <div key={artist.id} className="artist-card">
                        <div className="artist-avatar"></div>
                        <div className="artist-info">
                          <h4>{artist.name}</h4>
                          <p>{artist.bio || 'Sin descripción'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                    No se encontraron artistas
                  </p>
                )}
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'albums') && (
              <div className="results-section">
                <h3>Álbumes</h3>
                {searchResults.albums && searchResults.albums.length > 0 ? (
                  <div className="artists-grid">
                    {searchResults.albums.map(album => (
                      <div key={album.id} className="artist-card">
                        <div className="artist-avatar"></div>
                        <div className="artist-info">
                          <h4>{album.title}</h4>
                          <p>{album.artist_name || 'Artista desconocido'}</p>
                          {album.release_date && (
                            <p style={{ fontSize: '12px', color: '#888' }}>
                              {new Date(album.release_date).getFullYear()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                    No se encontraron álbumes
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!searchQuery && (
        <div className="search-suggestions">
          <h2>Explorar por categoría</h2>
          <div className="categories-grid">
            <div className="category-card" style={{background: '#FF2D55'}}>
              <h3>Pop</h3>
            </div>
            <div className="category-card" style={{background: '#5856D6'}}>
              <h3>Rock</h3>
            </div>
            <div className="category-card" style={{background: '#007AFF'}}>
              <h3>Hip Hop</h3>
            </div>
            <div className="category-card" style={{background: '#34C759'}}>
              <h3>Electrónica</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
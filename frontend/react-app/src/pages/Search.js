import React, { useState, useMemo, useEffect } from 'react';
import { searchAPI } from '../services/api.js';
import './Search.css';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchResults, setSearchResults] = useState({ songs: [], artists: [], albums: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Realizar búsqueda con debounce
  useEffect(() => {
    // Si no hay query, limpiar resultados
    if (!searchQuery.trim()) {
      setSearchResults({ songs: [], artists: [], albums: [] });
      setError(null);
      return;
    }

    // Implementar debounce para evitar muchas llamadas a la API
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await searchAPI.searchAll(searchQuery);

        if (response.success) {
          // Mapear los datos de la API a la estructura esperada por el componente
          const mappedResults = {
            songs: response.results.songs.map(song => ({
              id: song.id,
              title: song.title,
              artist: song.artist_name || 'Desconocido',
              album: song.album_title || 'Desconocido',
              duration: song.duration || 'N/A',
              audioFileUrl: song.audio_file_url
            })),
            artists: response.results.artists.map(artist => ({
              id: artist.id,
              name: artist.name,
              bio: artist.bio || '',
              imageUrl: artist.image_url
            })),
            albums: response.results.albums.map(album => ({
              id: album.id,
              title: album.title,
              artist: album.artist_name || 'Desconocido',
              releaseDate: album.release_date,
              coverImageUrl: album.cover_image_url
            }))
          };

          setSearchResults(mappedResults);
        } else {
          setError('Error al realizar la búsqueda');
        }
      } catch (err) {
        console.error('Error en búsqueda:', err);
        setError('Error al conectar con el servidor. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    }, 500); // Debounce de 500ms

    // Cleanup: cancelar el timeout si el usuario sigue escribiendo
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Filtrar resultados según el tab activo (Usando useMemo)
  const filteredResults = useMemo(() => {
    if (activeTab === 'all') {
      return searchResults;
    }
    return {
      songs: activeTab === 'songs' ? searchResults.songs : [],
      artists: activeTab === 'artists' ? searchResults.artists : [],
      albums: activeTab === 'albums' ? searchResults.albums : []
    };
  }, [searchResults, activeTab]);

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
            {/* Sección de Canciones (Corregido: Usar filteredResults) */}
            {(activeTab === 'all' || activeTab === 'songs') && filteredResults.songs.length > 0 && (
              <div className="results-section">
                <h3>Canciones {filteredResults.songs.length > 0 && `(${filteredResults.songs.length})`}</h3>
                {filteredResults.songs.map(song => (
                  <div key={song.id} className="result-item">
                    <div className="song-info">
                      <div className="song-cover"></div>
                      <div className="song-details">
                        <h4>{song.title}</h4>
                        {/* Corregido: Usar 'artist' y 'album' que vienen del objeto song de la base de datos */}
                        <p>{song.artist} • {song.album}</p>
                      </div>
                    </div>
                    <span className="song-duration">{song.duration || 'N/A'}</span>
                    <button className="play-btn-small">▶</button>
                  </div>
                ))}
              </div>
            )}

            {/* Sección de Artistas (Corregido: Usar filteredResults) */}
            {(activeTab === 'all' || activeTab === 'artists') && filteredResults.artists.length > 0 && (
              <div className="results-section">
                <h3>Artistas {filteredResults.artists.length > 0 && `(${filteredResults.artists.length})`}</h3>
                <div className="artists-grid">
                  {filteredResults.artists.map(artist => (
                    <div key={artist.id} className="artist-card">
                      <div className="artist-avatar" style={artist.imageUrl ? {backgroundImage: `url(${artist.imageUrl})`} : {}}></div>
                      <div className="artist-info">
                        <h4>{artist.name}</h4>
                        <p>{artist.bio || 'Artista'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sección de Álbumes (Corregido: Eliminada la sección duplicada y uso de filteredResults) */}
            {(activeTab === 'all' || activeTab === 'albums') && filteredResults.albums.length > 0 && (
              <div className="results-section">
                <h3>Álbumes {filteredResults.albums.length > 0 && `(${filteredResults.albums.length})`}</h3>
                <div className="albums-grid">
                  {filteredResults.albums.map(album => (
                    <div key={album.id} className="album-card">
                      <div className="album-cover" style={album.coverImageUrl ? {backgroundImage: `url(${album.coverImageUrl})`} : {}}></div>
                      <div className="album-info">
                        <h4>{album.title}</h4>
                        <p>{album.artist} • {album.releaseDate ? new Date(album.releaseDate).getFullYear() : 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensaje cuando no hay resultados */}
            {searchQuery &&
              filteredResults.songs.length === 0 &&
              filteredResults.artists.length === 0 &&
              filteredResults.albums.length === 0 && (
                <div className="no-results">
                  <h3>No se encontraron resultados para "{searchQuery}"</h3>
                  <p>Intenta con otras palabras clave</p>
                </div>
              )}
          </div>
        </div>
      )}

      {!searchQuery && (
        <div className="search-suggestions">
          <h2>Explorar por categoría</h2>
          <div className="categories-grid">
            <div className="category-card" style={{ background: '#FF2D55' }}>
              <h3>Pop</h3>
            </div>
            <div className="category-card" style={{ background: '#5856D6' }}>
              <h3>Rock</h3>
            </div>
            <div className="category-card" style={{ background: '#007AFF' }}>
              <h3>Hip Hop</h3>
            </div>
            <div className="category-card" style={{ background: '#34C759' }}>
              <h3>Electrónica</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
-- ============================================
-- MUSICSTREAMLITE - SEED DATA
-- ============================================
-- Este script se ejecuta TERCERO
-- Inserta datos de prueba para desarrollo

\c musicstream_db;

-- ============================================
-- USERS (Password: "test123" para todos)
-- ============================================
-- Hash BCrypt de "test123" con salt rounds = 12
INSERT INTO users (email, password_hash, name, date_of_birth, country) VALUES
('juan@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIB7ckSZyO', 'Juan Pérez', '1995-03-15', 'Colombia'),
('maria@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIB7ckSZyO', 'María García', '1998-07-22', 'México'),
('pedro@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIB7ckSZyO', 'Pedro Rodríguez', '1992-11-08', 'España'),
('admin@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIB7ckSZyO', 'Admin User', '1990-01-01', 'Colombia');

-- ============================================
-- USER PREFERENCES
-- ============================================
INSERT INTO user_preferences (user_id, theme, language, auto_play, quality_preference) VALUES
(1, 'dark', 'es', true, 'high'),
(2, 'light', 'es', true, 'medium'),
(3, 'dark', 'es', false, 'high'),
(4, 'dark', 'en', true, 'high');

-- ============================================
-- GENRES
-- ============================================
INSERT INTO genres (name, description) VALUES
('Pop', 'Música popular contemporánea'),
('Rock', 'Rock and Roll y sus derivados'),
('Hip Hop', 'Rap y música urbana'),
('Electrónica', 'Música electrónica y dance'),
('Reggaeton', 'Música urbana latina'),
('Jazz', 'Jazz clásico y contemporáneo'),
('Salsa', 'Salsa y música tropical'),
('Indie', 'Música independiente'),
('R&B', 'Rhythm and Blues'),
('Clásica', 'Música clásica');

-- ============================================
-- ARTISTS
-- ============================================
INSERT INTO artists (name, bio, image_url, country) VALUES
('The Weeknd', 'Cantante canadiense de R&B y Pop', 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb', 'Canada'),
('Bad Bunny', 'Cantante puertorriqueño de reggaeton y trap latino', 'https://i.scdn.co/image/ab6761610000e5eb4b2ac23b2ce1c7a1c2f5e596', 'Puerto Rico'),
('Taylor Swift', 'Cantante y compositora estadounidense', 'https://i.scdn.co/image/ab6761610000e5ebe672b5f553298dcdccb0e676', 'USA'),
('Drake', 'Rapero y cantante canadiense', 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9', 'Canada'),
('Billie Eilish', 'Cantante y compositora estadounidense de pop alternativo', 'https://i.scdn.co/image/ab6761610000e5eb6a447a1b5c748bfceb85ed7a', 'USA'),
('Ed Sheeran', 'Cantante y compositor británico', 'https://i.scdn.co/image/ab6761610000e5eb8ae7f2aaa9817a704a87ea36', 'UK'),
('Dua Lipa', 'Cantante británica de pop', 'https://i.scdn.co/image/ab6761610000e5eb8fd36e8c0d619f5eb584cbdc', 'UK'),
('J Balvin', 'Cantante colombiano de reggaeton', 'https://i.scdn.co/image/ab6761610000e5eb8ee9e1e0e0b98d3d3f5c6a1f', 'Colombia'),
('Ariana Grande', 'Cantante y actriz estadounidense', 'https://i.scdn.co/image/ab6761610000e5eba13b4e4b8f5f7b3d8c0e3d4c', 'USA'),
('Post Malone', 'Rapero y cantante estadounidense', 'https://i.scdn.co/image/ab6761610000e5eb9e9ddd5b6f4e6e2e3e3e3e3e', 'USA');

-- ============================================
-- ALBUMS
-- ============================================
INSERT INTO albums (artist_id, title, release_date, cover_image_url) VALUES
(1, 'After Hours', '2020-03-20', 'https://i.scdn.co/image/ab67616d0000b273ef7b872c4d2e4e1f4d8e9d0a'),
(2, 'Un Verano Sin Ti', '2022-05-06', 'https://i.scdn.co/image/ab67616d0000b273e5e5e5e5e5e5e5e5e5e5e5e5'),
(3, 'Midnights', '2022-10-21', 'https://i.scdn.co/image/ab67616d0000b273abcd1234abcd1234abcd1234'),
(4, 'Certified Lover Boy', '2021-09-03', 'https://i.scdn.co/image/ab67616d0000b2731234567812345678123456781'),
(5, 'Happier Than Ever', '2021-07-30', 'https://i.scdn.co/image/ab67616d0000b273987654321987654321987654'),
(6, 'Divide', '2017-03-03', 'https://i.scdn.co/image/ab67616d0000b273abababababababababababab'),
(7, 'Future Nostalgia', '2020-03-27', 'https://i.scdn.co/image/ab67616d0000b273cdcdcdcdcdcdcdcdcdcdcdcd'),
(8, 'Vibras', '2018-05-25', 'https://i.scdn.co/image/ab67616d0000b273efefefefefefefefefefefef'),
(9, 'Positions', '2020-10-30', 'https://i.scdn.co/image/ab67616d0000b273121212121212121212121212'),
(10, 'Hollywoods Bleeding', '2019-09-06', 'https://i.scdn.co/image/ab67616d0000b273343434343434343434343434');

-- ============================================
-- SONGS
-- ============================================
INSERT INTO songs (album_id, artist_id, genre_id, title, duration, audio_file_url, track_number) VALUES
-- Album: After Hours (The Weeknd)
(1, 1, 9, 'Blinding Lights', 200, 'https://storage.googleapis.com/music-stream-lite-bucket/songs/blinding-lights.mp3', 1),
(1, 1, 9, 'Save Your Tears', 215, 'https://storage.googleapis.com/music-stream-lite-bucket/songs/save-your-tears.mp3', 2),

-- Album: Un Verano Sin Ti (Bad Bunny)
(2, 2, 5, 'Moscow Mule', 245, 'https://storage.googleapis.com/music-stream-lite-bucket/songs/moscow-mule.mp3', 1),
(2, 2, 5, 'Tití Me Preguntó', 234, 'https://storage.googleapis.com/music-stream-lite-bucket/songs/titi-me-pregunto.mp3', 2),

-- Album: Midnights (Taylor Swift)
(3, 3, 1, 'Anti-Hero', 201, 'https://storage.googleapis.com/music-stream-lite-bucket/songs/anti-hero.mp3', 1),
(3, 3, 1, 'Lavender Haze', 202, 'https://storage.googleapis.com/music-stream-lite-bucket/songs/lavender-haze.mp3', 2),

-- Album: Certified Lover Boy (Drake)
(4, 4, 3, 'Champagne Poetry', 298, 'https://storage.googleapis.com/music-stream-lite-bucket/songs/champagne-poetry.mp3', 1),
(4, 4, 3, 'Way 2 Sexy', 272, 'https://storage.googleapis.com/music-stream-lite-bucket/songs/way-2-sexy.mp3', 2),

-- Album: Happier Than Ever (Billie Eilish)
(5, 5, 8, 'Happier Than Ever', 298, 'https://storage.googleapis.com/music-stream-lite-bucket/songs/happier-than-ever.mp3', 1),
(5, 5, 8, 'My Future', 210, 'https://storage.googleapis.com/music-stream-lite-bucket/songs/my-future.mp3', 2),

-- Album: Divide (Ed Sheeran)
(6, 6, 1, 'Shape of You', 233, 'https://storage.googleapis.com/music-stream-lite-bucket/songs/shape-of-you.mp3', 1),
(6, 6, 1, 'Perfect', 263, 'https://storage.googleapis.com/music-stream-lite-bucket/songs/perfect.mp3', 2),

-- Album: Future Nostalgia (Dua Lipa)
(7, 7, 1, 'Dont Start Now', 183, 'https://storage.googleapis.com/music-stream-lite-bucket/songs/dont-start-now.mp3', 1),
(7, 7, 1, 'Levitating', 203, 'https://storage.googleapis.com/music-stream-lite-bucket/songs/levitating.mp3', 2),

-- Album: Vibras (J Balvin)
(8, 8, 5, 'Mi Gente', 189, 'https://storage.googleapis.com/music-stream-lite-bucket/songs/mi-gente.mp3', 1),
(8, 8, 5, 'Ambiente', 199, 'https://storage.googleapis.com/music-stream-lite-bucket/songs/ambiente.mp3', 2),

-- Album: Positions (Ariana Grande)
(9, 9, 9, 'Positions', 172, 'https://storage.googleapis.com/music-stream-lite-bucket/songs/positions.mp3', 1),
(9, 9, 9, '34+35', 173, 'https://storage.googleapis.com/music-stream-lite-bucket/songs/34-35.mp3', 2);

-- ============================================
-- PLAYLISTS
-- ============================================
INSERT INTO playlists (user_id, name, description, is_public) VALUES
(1, 'Mis Favoritas', 'Mis canciones favoritas de todos los tiempos', true),
(1, 'Para Entrenar', 'Música motivacional para el gym', false),
(2, 'Relax', 'Canciones para relajarse', true),
(3, 'Party Mix', 'Para las fiestas', true);

-- ============================================
-- PLAYLIST SONGS
-- ============================================
INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES
-- Playlist: Mis Favoritas (user 1)
(1, 1, 1),  -- Blinding Lights
(1, 5, 2),  -- Anti-Hero
(1, 11, 3), -- Shape of You

-- Playlist: Para Entrenar (user 1)
(2, 3, 1),  -- Moscow Mule
(2, 7, 2),  -- Champagne Poetry
(2, 13, 3), -- Dont Start Now

-- Playlist: Relax (user 2)
(3, 2, 1),  -- Save Your Tears
(3, 6, 2),  -- Lavender Haze
(3, 12, 3), -- Perfect

-- Playlist: Party Mix (user 3)
(4, 3, 1),  -- Moscow Mule
(4, 13, 2), -- Dont Start Now
(4, 15, 3); -- Mi Gente

-- ============================================
-- FAVORITES
-- ============================================
INSERT INTO favorites (user_id, song_id) VALUES
(1, 1),  -- Juan likes Blinding Lights
(1, 5),  -- Juan likes Anti-Hero
(1, 11), -- Juan likes Shape of You
(2, 2),  -- Maria likes Save Your Tears
(2, 6),  -- Maria likes Lavender Haze
(3, 3),  -- Pedro likes Moscow Mule
(3, 13); -- Pedro likes Dont Start Now

-- ============================================
-- PLAY HISTORY (últimos 7 días)
-- ============================================
INSERT INTO play_history (user_id, song_id, played_at, duration_played, completed) VALUES
-- Usuario 1 (Juan)
(1, 1, NOW() - INTERVAL '1 hour', 200, true),
(1, 5, NOW() - INTERVAL '2 hours', 201, true),
(1, 11, NOW() - INTERVAL '3 hours', 233, true),
(1, 1, NOW() - INTERVAL '1 day', 200, true),
(1, 3, NOW() - INTERVAL '2 days', 245, true),

-- Usuario 2 (Maria)
(2, 2, NOW() - INTERVAL '30 minutes', 215, true),
(2, 6, NOW() - INTERVAL '1 hour', 202, true),
(2, 12, NOW() - INTERVAL '1 day', 263, true),

-- Usuario 3 (Pedro)
(3, 3, NOW() - INTERVAL '45 minutes', 245, true),
(3, 13, NOW() - INTERVAL '2 hours', 183, true);

-- ============================================
-- USER SONG STATS
-- ============================================
INSERT INTO user_song_stats (user_id, song_id, play_count, total_time_played, last_played) VALUES
(1, 1, 5, 1000, NOW() - INTERVAL '1 hour'),      -- Juan escuchó Blinding Lights 5 veces
(1, 5, 3, 603, NOW() - INTERVAL '2 hours'),      -- Juan escuchó Anti-Hero 3 veces
(1, 11, 2, 466, NOW() - INTERVAL '3 hours'),     -- Juan escuchó Shape of You 2 veces
(2, 2, 4, 860, NOW() - INTERVAL '30 minutes'),   -- Maria escuchó Save Your Tears 4 veces
(2, 6, 2, 404, NOW() - INTERVAL '1 hour'),       -- Maria escuchó Lavender Haze 2 veces
(3, 3, 3, 735, NOW() - INTERVAL '45 minutes'),   -- Pedro escuchó Moscow Mule 3 veces
(3, 13, 2, 366, NOW() - INTERVAL '2 hours');     -- Pedro escuchó Dont Start Now 2 veces

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Seed data inserted successfully!' AS status;

-- Mostrar resumen de datos insertados
SELECT 
    (SELECT COUNT(*) FROM users) AS users_count,
    (SELECT COUNT(*) FROM artists) AS artists_count,
    (SELECT COUNT(*) FROM albums) AS albums_count,
    (SELECT COUNT(*) FROM songs) AS songs_count,
    (SELECT COUNT(*) FROM playlists) AS playlists_count,
    (SELECT COUNT(*) FROM favorites) AS favorites_count,
    (SELECT COUNT(*) FROM play_history) AS play_history_count;
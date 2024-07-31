# Telegram бот для управления постами WordPress. 

Этот Telegram бот помогает управлять постами WordPress на вашем сайте. Написан на NodeJs + GrammyJS. Использует REST API WP.

## Возможности

- Установка языка
- Создание новых постов
- Редактирование существующих постов по их ID
- Загрузка коллекции изображений с одинаковым заголовком, описанием и категорией
- Удаление постов по их ID
- Получение информации о командах бота

## Команды бота

### `/start`

Отображает приветственное сообщение, ваш Telegram ID и инструкции по передаче его администратору для получения доступа к боту. Также позволяет изменить язык.


### `/faq`

Отображает информацию о боте и доступных командах.


### `/new_post`

Добавляет новый пост. Бот запрашивает следующие данные:
- Заголовок
- Описание (можно пропустить)
- Категория
- Изображение (можно пропустить)

После публикации бот сообщает ID поста.

### `/edit_post`

Изменяет пост по его ID. Бот позволяет изменить:
- Заголовок
- Описание
- Категорию
- Изображение

### `/photo`

Загружает коллекцию изображений с одинаковым заголовком, описанием и категорией. Используется для публикации изображений в портфолио.

### `/delete_post`

Удаляет пост по его ID. Бот сообщает об успешном удалении поста.

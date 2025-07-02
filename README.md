# AI Website Generator

A Node.js application that generates fictional website content using AI models through the OpenRouter API.
Requires an OpenRouter API key. Some models can be used free of charge.

## Features

- Dynamic website content generation using AI models
- Model selection from OpenRouter's available models
- Session-based configuration
- Custom prompt templates
- Automatic model validation and fallback

## Requirements

- **Node.js**: Version 14.0 or higher
- **npm**: Included with Node.js installation
- **OpenRouter API Account**: Required for AI model access
  - Sign up at [OpenRouter](https://openrouter.ai/)
  - Obtain an API token
  - You can use the free models without a credit card

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your configuration:
   ```
   OPENROUTER_TOKEN=your_openrouter_api_token
   SESSION_SECRET=your_session_secret
   PORT=3000
   ```

## Project Structure

```
AI-Website/
├── app.js                 # Main application entry point
├── config/
│   └── config.js         # Configuration settings
├── services/
│   ├── modelsService.js  # Model management service
│   └── openRouterService.js # OpenRouter API service
├── routes/
│   └── index.js          # Route handlers
├── middleware/
│   └── errorHandler.js   # Error handling middleware
├── templates/
│   ├── index.html        # Main template
│   └── models.json       # Available models cache
└── package.json
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Reset Models
Visit `/reset` to fetch and update the available models from OpenRouter.

### Start Generation
Visit `/the-page-where-it-starts` to configure and start generating content.
Visiting any other URL without having configured a website redirects you here.

## Endpoints

- `GET /the-page-where-it-starts` - Main configuration page
- `GET /reset` - Update available models
- `GET /start` - Start a new session with parameters
- `GET /*` - Dynamic content generation for any route

## Configuration

The application uses environment variables for configuration:

- `OPENROUTER_TOKEN` - Your OpenRouter API token
- `SESSION_SECRET` - Secret for session encryption
- `PORT` - Server port (default: 3000)

## Services

### ModelsService
Manages available AI models:
- Loads models from cache
- Fetches updated models from OpenRouter
- Validates model selection
- Provides fallback models

### OpenRouterService
Handles AI content generation:
- Generates content using OpenRouter API
- Cleans response content
- Manages prompt templates
- Handles API errors

## Error Handling

The application includes comprehensive error handling:
- Global error middleware
- API error handling
- Graceful fallbacks for invalid models
- User-friendly error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC 

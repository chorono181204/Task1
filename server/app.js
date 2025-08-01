require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var helmet = require('helmet');
var config = require('./config');

var indexRouter = require('./routes/index');

var analyzeRouter = require('./routes/analyze');
var resultRouter = require('./routes/result');

var app = express();


app.use(helmet({
  contentSecurityPolicy: false, 
  crossOriginEmbedderPolicy: false
}));


app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/', indexRouter);

app.use('/analyze', analyzeRouter);
app.use('/result', resultRouter);


app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
app.get('/api', (req, res) => {
  res.json({
    name: 'YouTube Analysis Service',
    version: '1.0.0',
    endpoints: {
      'POST /analyze': 'Start YouTube video analysis',
      'GET /result/:id': 'Get analysis result',
      'GET /analyze/health': 'System health check',
      'GET /health': 'Basic health check'
    }
  });
});


app.use(function(req, res, next) {
  next(createError(404));
});


app.use(function(err, req, res, next) {
 
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};


  console.error('Error:', err);

 
  if (err.status === 404) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: 'The requested resource was not found.'
    });
  }

  
  res.status(err.status || 500);
  
  
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.json({
      success: false,
      error: err.message,
      status: err.status || 500
    });
  } else {
    
    res.render('error');
  }
});

module.exports = app;


if (require.main === module) {
  const port = config.port;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`API docs: http://localhost:${port}/api`);
  });
}

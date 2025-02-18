import app from './app';
import env from './config/env';

const PORT = env.PORT || 8080;

app.listen(env.PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

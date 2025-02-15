import app from './app';
import env from './config/env';

app.listen(env.PORT, () => {
    console.log(`Server started on port ${env.PORT}`);
});

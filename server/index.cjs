
const express = require('express');
const cors = require('cors');
const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const BASE_REPO_DIR = path.join(__dirname, 'repos');

// Ensure base repos dir exists
if (!fs.existsSync(BASE_REPO_DIR)) {
    fs.mkdirSync(BASE_REPO_DIR);
}

app.post('/api/upload', async (req, res) => {
    const { images, config, repoUrl, folderPath } = req.body;

    if (!repoUrl) {
        return res.status(400).json({ success: false, message: 'Repo URL is required' });
    }

    // Generate a unique directory name for this repo URL to allow switching repos
    // using hash of url to handle special chars safe
    const repoHash = crypto.createHash('md5').update(repoUrl).digest('hex');
    const localRepoPath = path.join(BASE_REPO_DIR, repoHash);

    const git = simpleGit();

    try {
        console.log(`Processing upload for repo: ${repoUrl}`);

        // 1. Initialize or pull repo
        if (!fs.existsSync(path.join(localRepoPath, '.git'))) {
            // Clean dir if exists but empty or broken
            if (fs.existsSync(localRepoPath)) {
                fs.rmSync(localRepoPath, { recursive: true, force: true });
            }
            fs.mkdirSync(localRepoPath);

            console.log('Cloning repo...');
            await git.clone(repoUrl, localRepoPath);
        }

        // Switch git instance to local path
        const repoGit = simpleGit(localRepoPath);

        console.log('Pulling latest changes...');
        try {
            await repoGit.pull();
        } catch (e) {
            console.warn('Pull warning:', e.message);
        }

        // 2. Resolve Target Directory
        let targetDir = localRepoPath;
        if (folderPath && folderPath.trim() !== '') {
            targetDir = path.join(localRepoPath, folderPath);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
        }

        // 3. Write files
        console.log(`Writing ${images.length} images to ${folderPath || 'root'}...`);
        for (const img of images) {
            const filePath = path.join(targetDir, img.name);
            const buffer = Buffer.from(img.data, 'base64');
            fs.writeFileSync(filePath, buffer);
        }

        console.log('Writing config.json...');
        fs.writeFileSync(
            path.join(targetDir, 'config.json'),
            JSON.stringify(config, null, 2)
        );

        // 4. Git operations
        console.log('Committing changes...');
        await repoGit.add('./*');
        const status = await repoGit.status();

        if (status.files.length > 0) {
            const commitMsg = folderPath
                ? `Update avatars in ${folderPath}`
                : 'Update avatars via Avatar Exporter';
            await repoGit.commit(commitMsg);

            console.log('Pushing to remote...');
            await repoGit.push();
            console.log('Done!');
            res.json({ success: true, message: 'Uploaded successfully!' });
        } else {
            console.log('No changes to commit.');
            res.json({ success: true, message: 'No changes detected.' });
        }

    } catch (error) {
        console.error('Upload failed:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
